package me.nghlong3004.olympic.exam.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.document.repository.SubjectRepository;
import me.nghlong3004.olympic.exam.entity.Exam;
import me.nghlong3004.olympic.exam.entity.ExamItem;
import me.nghlong3004.olympic.exam.repository.ExamItemRepository;
import me.nghlong3004.olympic.exam.repository.ExamRepository;
import me.nghlong3004.olympic.exam.request.ExamItemRequest;
import me.nghlong3004.olympic.exam.request.SaveExamDraftRequest;
import me.nghlong3004.olympic.exam.response.ExamDraftResponse;
import me.nghlong3004.olympic.question.repository.QuestionRepository;
import org.springframework.stereotype.Component;

/**
 * Creates and replaces an owned draft inside the caller's transaction.
 * Update receives the exam row already locked by {@code ExamAccess}. This bean does not
 * start a transaction, publish a paper, or copy figure bytes.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExamDrafts {
  private final ExamAccess access;
  private final ExamPlacementPolicy placementPolicy;
  private final ExamQuestionSourcePolicy sourcePolicy;
  private final ExamProjections projections;
  private final ExamRepository examRepository;
  private final ExamItemRepository examItemRepository;
  private final QuestionRepository questionRepository;
  private final SubjectRepository subjectRepository;
  private final Clock clock;

  public ExamDraftResponse create(SaveExamDraftRequest request) {
    var author = access.requireStaff();
    var subjectId = requireSubject(request.subjectId());
    var title = placementPolicy.title(request.title(), false);
    var instructions = placementPolicy.instructions(request.instructions());
    var placements = placements(subjectId, request.items());
    var now = OffsetDateTime.now(clock);
    var saved = examRepository.saveAndFlush(Exam.builder()
        .subjectId(subjectId)
        .createdById(author.getId())
        .title(title)
        .instructions(instructions)
        .releaseAt(request.releaseAt())
        .createdAt(now)
        .updatedAt(now)
        .build());
    replaceItems(saved.getId(), placements);
    log.info("Exam draft created: examId={}", saved.getId());
    return projections.draft(saved, examItemRepository.findByExamIdOrderByPositionAsc(saved.getId()));
  }

  public ExamDraftResponse update(Exam exam, SaveExamDraftRequest request) {
    access.requireExpected(exam, request.expectedVersion());
    var subjectId = requireSubject(request.subjectId());
    var title = placementPolicy.title(request.title(), false);
    var instructions = placementPolicy.instructions(request.instructions());
    var placements = placements(subjectId, request.items());
    replaceItems(exam.getId(), placements);
    exam.setSubjectId(subjectId);
    exam.setTitle(title);
    exam.setInstructions(instructions);
    exam.setReleaseAt(request.releaseAt());
    exam.setUpdatedAt(touch(exam.getUpdatedAt()));
    var saved = examRepository.saveAndFlush(exam);
    log.info("Exam draft updated: examId={}", saved.getId());
    return projections.draft(saved, examItemRepository.findByExamIdOrderByPositionAsc(saved.getId()));
  }

  /**
   * Dirties the locked parent on every successful update. PostgreSQL timestamptz stores
   * microseconds, so a fixed clock still persists a later updatedAt. Hibernate then
   * increments @Version once on the parent flush that follows item replacement.
   */
  private OffsetDateTime touch(OffsetDateTime current) {
    var now = OffsetDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
    var stored = current == null ? null : current.truncatedTo(ChronoUnit.MICROS);
    if (stored == null || now.isAfter(stored)) {
      return now;
    }
    return stored.plus(1, ChronoUnit.MICROS);
  }

  private UUID requireSubject(UUID subjectId) {
    if (subjectId == null || !subjectRepository.existsById(subjectId)) {
      throw ErrorCode.VALIDATION_ERROR.throwIt(ExamQuestionSourcePolicy.PLACEMENT_DISABLED);
    }
    return subjectId;
  }

  private List<Placement> placements(UUID subjectId, List<ExamItemRequest> items) {
    placementPolicy.requireItems(items, false);
    var loaded = new HashMap<UUID, ExamQuestionSourcePolicy.FrozenQuestion>();
    var prepared = new ArrayList<Placement>(items.size());
    for (var item : items) {
      var frozen = item.questionId() == null
          ? load(null, subjectId)
          : loaded.computeIfAbsent(item.questionId(), id -> load(id, subjectId));
      var weights = placementPolicy.requireWeights(frozen.content(), item.points(), item.partPoints());
      prepared.add(new Placement(
          frozen.questionId(),
          placementPolicy.requirePoints(item.points()),
          projections.partPoints(weights),
          placementPolicy.instructions(item.instructions())));
    }
    return prepared;
  }

  private ExamQuestionSourcePolicy.FrozenQuestion load(UUID questionId, UUID subjectId) {
    var question = questionId == null
        ? null
        : questionRepository.findDetailedById(questionId).orElse(null);
    return sourcePolicy.requireDraftPlacement(question, subjectId);
  }

  private void replaceItems(UUID examId, List<Placement> placements) {
    var existing = examItemRepository.findByExamIdOrderByPositionAsc(examId);
    if (!existing.isEmpty()) {
      examItemRepository.deleteAll(existing);
      examItemRepository.flush();
    }
    if (placements.isEmpty()) {
      return;
    }
    var rows = new ArrayList<ExamItem>(placements.size());
    for (var position = 0; position < placements.size(); position++) {
      var placement = placements.get(position);
      rows.add(ExamItem.builder()
          .examId(examId)
          .position(position)
          .questionId(placement.questionId())
          .points(placement.points())
          .partPoints(placement.partPoints())
          .instructions(placement.instructions())
          .build());
    }
    examItemRepository.saveAll(rows);
    examItemRepository.flush();
  }

  /**
   * Weights are stored by part id. jsonb does not keep object field order;
   * {@code content.parts} remains the multipart order.
   */
  private record Placement(
      UUID questionId, BigDecimal points, JsonNode partPoints, String instructions) {}
}
