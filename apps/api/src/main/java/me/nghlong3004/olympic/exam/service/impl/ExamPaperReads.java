package me.nghlong3004.olympic.exam.service.impl;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.exam.dto.ExamFigureDownload;
import me.nghlong3004.olympic.exam.entity.ExamItem;
import me.nghlong3004.olympic.exam.entity.ExamPaper;
import me.nghlong3004.olympic.exam.repository.ExamItemRepository;
import me.nghlong3004.olympic.exam.repository.ExamPaperFigureRepository;
import me.nghlong3004.olympic.exam.repository.ExamPaperItemRepository;
import me.nghlong3004.olympic.exam.repository.ExamPaperRepository;
import me.nghlong3004.olympic.exam.response.ExamPaperSummaryResponse;
import me.nghlong3004.olympic.exam.response.ExamPaperView;
import me.nghlong3004.olympic.exam.response.StaffExamItemResponse;
import me.nghlong3004.olympic.exam.response.StaffExamSolutionItemResponse;
import me.nghlong3004.olympic.exam.service.impl.ExamQuestionSourcePolicy.FrozenQuestion;
import me.nghlong3004.olympic.question.repository.QuestionRepository;
import me.nghlong3004.olympic.user.entity.User;
import org.springframework.stereotype.Component;

/**
 * Reads a draft preview or a frozen paper inside the caller's transaction.
 * Preview does not insert a paper. Students see a released paper through the student record,
 * including when solutions is requested. Solution-only bytes are not found for a student.
 * There is no expiry.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Component
@RequiredArgsConstructor
public class ExamPaperReads {
  private final ExamAccess access;
  private final ExamPlacementPolicy placementPolicy;
  private final ExamQuestionSourcePolicy sourcePolicy;
  private final ExamProjections projections;
  private final ExamItemRepository examItemRepository;
  private final ExamPaperRepository examPaperRepository;
  private final ExamPaperItemRepository examPaperItemRepository;
  private final ExamPaperFigureRepository examPaperFigureRepository;
  private final QuestionRepository questionRepository;
  private final Clock clock;

  public ExamPaperView preview(UUID examId, boolean solutions) {
    var exam = access.requireOwned(examId);
    var items = examItemRepository.findByExamIdOrderByPositionAsc(exam.getId());
    var loaded = new HashMap<UUID, FrozenQuestion>();
    if (solutions) {
      var solved = new ArrayList<StaffExamSolutionItemResponse>();
      for (var item : items) {
        if (item == null) {
          continue;
        }
        var frozen = publishable(item, exam.getSubjectId(), loaded);
        solved.add(projections.solutionItem(
            item, frozen.content(), frozen.answer(), frozen.explanation()));
      }
      return projections.solutionPreview(exam, solved);
    }
    var plain = new ArrayList<StaffExamItemResponse>();
    for (var item : items) {
      if (item == null) {
        continue;
      }
      var frozen = publishable(item, exam.getSubjectId(), loaded);
      plain.add(projections.staffItem(item, frozen.content()));
    }
    return projections.staffPreview(exam, plain);
  }

  public List<ExamPaperSummaryResponse> listPapers() {
    var user = access.actor();
    var papers = access.staff(user)
        ? examPaperRepository.findAllOrdered()
        : examPaperRepository.findReleased(OffsetDateTime.now(clock));
    var summaries = new ArrayList<ExamPaperSummaryResponse>();
    if (papers != null) {
      for (var paper : papers) {
        if (paper != null) {
          summaries.add(projections.summary(paper));
        }
      }
    }
    return List.copyOf(summaries);
  }

  public ExamPaperView getPaper(UUID paperId, boolean solutions) {
    var user = access.actor();
    var paper = visible(user, paperId);
    var items = examPaperItemRepository.findByPaperIdOrderByPositionAsc(paper.getId());
    if (!access.staff(user)) {
      return projections.studentPaper(paper, items);
    }
    return solutions ? projections.solutionPaper(paper, items) : projections.staffPaper(paper, items);
  }

  public ExamFigureDownload downloadFigure(UUID paperId, UUID assetId) {
    var user = access.actor();
    var paper = visible(user, paperId);
    if (assetId == null) {
      throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
    }
    var figure = examPaperFigureRepository.findByPaperIdAndAssetId(paper.getId(), assetId)
        .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (!access.staff(user) && (figure.isSolutionOnly() || !visibleContent(paper.getId(), assetId))) {
      throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
    }
    return projections.download(figure);
  }

  private FrozenQuestion publishable(ExamItem item, UUID subjectId, HashMap<UUID, FrozenQuestion> loaded) {
    var frozen = item.getQuestionId() == null
        ? sourcePolicy.requirePublishablePlacement(null, subjectId)
        : loaded.computeIfAbsent(item.getQuestionId(), id -> sourcePolicy.requirePublishablePlacement(
            questionRepository.findDetailedById(id).orElse(null), subjectId));
    placementPolicy.requireWeights(frozen.content(), item.getPoints(), projections.weights(item.getPartPoints()));
    return frozen;
  }

  private ExamPaper visible(User user, UUID paperId) {
    var paper = paperId == null
        ? null
        : examPaperRepository.findById(paperId).orElse(null);
    if (paper == null || (!access.staff(user) && !released(paper))) {
      throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
    }
    return paper;
  }

  private boolean released(ExamPaper paper) {
    var releaseAt = paper.getReleaseAt();
    return releaseAt != null && !releaseAt.isAfter(OffsetDateTime.now(clock));
  }

  private boolean visibleContent(UUID paperId, UUID assetId) {
    for (var item : examPaperItemRepository.findByPaperIdOrderByPositionAsc(paperId)) {
      if (item != null && projections.assetIds(item.getContentJson()).contains(assetId)) {
        return true;
      }
    }
    return false;
  }
}
