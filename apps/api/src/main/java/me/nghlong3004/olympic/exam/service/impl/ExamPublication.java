package me.nghlong3004.olympic.exam.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.exam.ExamLimits;
import me.nghlong3004.olympic.exam.entity.Exam;
import me.nghlong3004.olympic.exam.entity.ExamItem;
import me.nghlong3004.olympic.exam.entity.ExamPaper;
import me.nghlong3004.olympic.exam.entity.ExamPaperFigure;
import me.nghlong3004.olympic.exam.entity.ExamPaperItem;
import me.nghlong3004.olympic.exam.repository.ExamItemRepository;
import me.nghlong3004.olympic.exam.repository.ExamPaperFigureRepository;
import me.nghlong3004.olympic.exam.repository.ExamPaperItemRepository;
import me.nghlong3004.olympic.exam.repository.ExamPaperRepository;
import me.nghlong3004.olympic.exam.repository.ExamRepository;
import me.nghlong3004.olympic.exam.request.PublishExamRequest;
import me.nghlong3004.olympic.exam.response.StaffExamSolutionResponse;
import me.nghlong3004.olympic.question.entity.Question;
import me.nghlong3004.olympic.question.entity.QuestionFigure;
import me.nghlong3004.olympic.question.repository.QuestionRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

/**
 * Freezes the next paper inside the caller's transaction.
 * The caller already holds the exam row lock. Question rows use {@code findForUpdateById}
 * in id order, then each question's figure rows are locked with {@code FOR UPDATE}.
 * The exam row stays clean until the paper, items, and byte copies have been flushed.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExamPublication {
  private static final BigDecimal MAX_TOTAL = new BigDecimal("100000.00");
  private static final Set<String> RASTER = Set.of("image/jpeg", "image/png", "image/webp");

  private final ExamAccess access;
  private final ExamPlacementPolicy placementPolicy;
  private final ExamQuestionSourcePolicy sourcePolicy;
  private final ExamProjections projections;
  private final ExamRepository examRepository;
  private final ExamItemRepository examItemRepository;
  private final ExamPaperRepository examPaperRepository;
  private final ExamPaperItemRepository examPaperItemRepository;
  private final ExamPaperFigureRepository examPaperFigureRepository;
  private final QuestionRepository questionRepository;
  private final JdbcTemplate jdbcTemplate;
  private final Clock clock;

  public StaffExamSolutionResponse publish(Exam exam, PublishExamRequest request) {
    access.requireExpected(exam, request.expectedVersion());
    var snapshot = prepare(exam);
    var versionNumber = nextVersion(exam);
    var paper = examPaperRepository.saveAndFlush(ExamPaper.builder()
        .examId(exam.getId())
        .versionNumber(versionNumber)
        .title(snapshot.title())
        .subjectId(exam.getSubjectId())
        .instructions(snapshot.instructions())
        .releaseAt(exam.getReleaseAt())
        .publishedAt(OffsetDateTime.now(clock).truncatedTo(ChronoUnit.MICROS))
        .totalPoints(snapshot.total())
        .createdById(exam.getCreatedById())
        .build());
    // Child rows store the paper id directly, so the paper insert must flush first.
    saveItems(paper.getId(), snapshot.placements());
    saveFigures(paper.getId(), snapshot.figures());
    exam.setLatestPublishedVersion(versionNumber);
    exam.setUpdatedAt(touch(exam.getUpdatedAt()));
    examRepository.saveAndFlush(exam);
    log.info(
        "Exam published: examId={}, paperId={}, versionNumber={}",
        exam.getId(), paper.getId(), versionNumber);
    return projections.solutionPaper(
        paper, examPaperItemRepository.findByPaperIdOrderByPositionAsc(paper.getId()));
  }

  private Snapshot prepare(Exam exam) {
    var items = examItemRepository.findByExamIdOrderByPositionAsc(exam.getId());
    placementPolicy.requireItems(items, true);
    var title = placementPolicy.title(exam.getTitle(), true);
    var instructions = placementPolicy.instructions(exam.getInstructions());
    placementPolicy.requireRelease(exam.getReleaseAt());
    var locked = lockQuestions(items);
    var placements = new ArrayList<FrozenPlacement>(items.size());
    var figures = new LinkedHashMap<UUID, FigureCopy>();
    var total = new BigDecimal("0.00");
    for (var item : items) {
      var frozen = sourcePolicy.requirePublishablePlacement(
          locked.get(item.getQuestionId()), exam.getSubjectId());
      var points = placementPolicy.requirePoints(item.getPoints());
      var weights = placementPolicy.requireWeights(
          frozen.content(), points, projections.weights(item.getPartPoints()));
      var content = projections.copy(frozen.content());
      var answer = projections.copy(frozen.answer());
      var explanation = projections.copy(frozen.explanation());
      collect(frozen.figures(), content, explanation, figures);
      placements.add(new FrozenPlacement(
          frozen.questionId(),
          item.getPosition(),
          points,
          projections.partPoints(weights),
          placementPolicy.instructions(item.getInstructions()),
          content,
          answer,
          explanation));
      total = total.add(points);
    }
    if (total.compareTo(MAX_TOTAL) > 0) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Exam total points must be at most 100000");
    }
    return new Snapshot(title, instructions, total, placements, figures);
  }

  private Map<UUID, Question> lockQuestions(List<ExamItem> items) {
    var ids = new ArrayList<UUID>();
    for (var item : items) {
      if (item.getQuestionId() != null && !ids.contains(item.getQuestionId())) {
        ids.add(item.getQuestionId());
      }
    }
    ids.sort(Comparator.naturalOrder());
    var locked = new HashMap<UUID, Question>();
    for (var id : ids) {
      var question = questionRepository.findForUpdateById(id).orElse(null);
      locked.put(id, question);
      if (question != null) {
        lockFigures(id);
      }
    }
    return locked;
  }

  private void lockFigures(UUID questionId) {
    jdbcTemplate.query(
        "select id from question_figures where question_id = ? order by id for update",
        (ResultSetExtractor<Void>) result -> {
          while (result.next()) {
            result.getObject(1);
          }
          return null;
        },
        questionId);
  }

  private void collect(
      List<QuestionFigure> figures,
      JsonNode content,
      JsonNode explanation,
      Map<UUID, FigureCopy> copies) {
    if (figures == null) {
      return;
    }
    for (var figure : figures) {
      if (figure == null || !projections.referenced(figure.getId(), content, explanation)) {
        continue;
      }
      var solutionOnly = projections.solutionOnly(figure.getId(), content, explanation);
      var existing = copies.get(figure.getId());
      if (existing == null) {
        copies.put(figure.getId(), new FigureCopy(figure, solutionOnly));
      } else if (!solutionOnly) {
        existing.visible();
      }
    }
  }

  private void saveItems(UUID paperId, List<FrozenPlacement> placements) {
    var rows = new ArrayList<ExamPaperItem>(placements.size());
    for (var placement : placements) {
      rows.add(ExamPaperItem.builder()
          .paperId(paperId)
          .position(placement.position())
          .questionId(placement.questionId())
          .points(placement.points())
          .partPoints(placement.partPoints())
          .instructions(placement.instructions())
          .contentJson(placement.content())
          .answerJson(placement.answer())
          .explanationJson(placement.explanation())
          .build());
    }
    examPaperItemRepository.saveAll(rows);
    examPaperItemRepository.flush();
  }

  private void saveFigures(UUID paperId, Map<UUID, FigureCopy> figures) {
    if (figures.isEmpty()) {
      return;
    }
    var rows = new ArrayList<ExamPaperFigure>(figures.size());
    for (var copy : figures.values()) {
      var bytes = requireCopy(copy.figure);
      rows.add(ExamPaperFigure.builder()
          .paperId(paperId)
          .assetId(copy.figure.getId())
          .questionId(copy.figure.getQuestionId())
          .originalName(copy.figure.getOriginalName())
          .contentType(copy.figure.getContentType())
          .size(bytes.length)
          .content(bytes)
          .solutionOnly(copy.solutionOnly)
          .build());
    }
    examPaperFigureRepository.saveAll(rows);
    examPaperFigureRepository.flush();
  }

  private static byte[] requireCopy(QuestionFigure figure) {
    var name = figure.getOriginalName();
    var type = figure.getContentType();
    if (name == null || name.length() > 200 || type == null || !RASTER.contains(type)) {
      throw ErrorCode.FILE_TYPE_NOT_ALLOWED.throwIt("Figure must be JPEG, PNG, or WebP");
    }
    var source = figure.getContent();
    var bytes = source == null ? new byte[0] : source.clone();
    if (bytes.length == 0 || bytes.length > ExamLimits.MAX_FIGURE_BYTES || figure.getSize() != bytes.length) {
      throw ErrorCode.FILE_TOO_LARGE.throwIt("Figure is empty, truncated, or too large");
    }
    return bytes;
  }

  private static int nextVersion(Exam exam) {
    var current = exam.getLatestPublishedVersion();
    return current == null ? 1 : current + 1;
  }

  private OffsetDateTime touch(OffsetDateTime current) {
    var now = OffsetDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
    var stored = current == null ? null : current.truncatedTo(ChronoUnit.MICROS);
    if (stored == null || now.isAfter(stored)) {
      return now;
    }
    return stored.plus(1, ChronoUnit.MICROS);
  }

  private record Snapshot(
      String title,
      String instructions,
      BigDecimal total,
      List<FrozenPlacement> placements,
      Map<UUID, FigureCopy> figures) {}

  private record FrozenPlacement(
      UUID questionId,
      int position,
      BigDecimal points,
      JsonNode partPoints,
      String instructions,
      JsonNode content,
      JsonNode answer,
      JsonNode explanation) {}

  /**
   * One copied asset per paper. A duplicate placement that shows the asset in content
   * clears solutionOnly; explanation-only references do not hide a visible copy.
   */
  private static final class FigureCopy {
    private final QuestionFigure figure;
    private boolean solutionOnly;

    private FigureCopy(QuestionFigure figure, boolean solutionOnly) {
      this.figure = figure;
      this.solutionOnly = solutionOnly;
    }

    private void visible() {
      solutionOnly = false;
    }
  }
}
