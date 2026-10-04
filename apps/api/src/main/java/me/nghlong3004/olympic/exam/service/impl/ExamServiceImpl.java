package me.nghlong3004.olympic.exam.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.exam.dto.ExamFigureDownload;
import me.nghlong3004.olympic.exam.repository.ExamItemRepository;
import me.nghlong3004.olympic.exam.repository.ExamRepository;
import me.nghlong3004.olympic.exam.request.PublishExamRequest;
import me.nghlong3004.olympic.exam.request.SaveExamDraftRequest;
import me.nghlong3004.olympic.exam.response.ExamDraftResponse;
import me.nghlong3004.olympic.exam.response.ExamPaperSummaryResponse;
import me.nghlong3004.olympic.exam.response.ExamPaperView;
import me.nghlong3004.olympic.exam.response.StaffExamSolutionResponse;
import me.nghlong3004.olympic.exam.service.ExamService;
import me.nghlong3004.olympic.user.enums.Role;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Transaction boundary for prepared exams. Helpers join this transaction and do not start one.
 * Publish locks the exam row before any question or figure is loaded.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExamServiceImpl implements ExamService {
  private final ExamAccess access;
  private final ExamDrafts drafts;
  private final ExamPublication publication;
  private final ExamPaperReads reads;
  private final ExamProjections projections;
  private final ExamRepository examRepository;
  private final ExamItemRepository examItemRepository;

  @Override
  @Transactional(readOnly = true)
  public List<ExamDraftResponse> listDrafts() {
    var user = access.requireStaff();
    var exams = user.getRole() == Role.ADMIN
        ? examRepository.findAllOrdered()
        : examRepository.findOwned(user.getId());
    var responses = new ArrayList<ExamDraftResponse>();
    if (exams != null) {
      for (var exam : exams) {
        if (exam != null) {
          responses.add(projections.draft(
              exam, examItemRepository.findByExamIdOrderByPositionAsc(exam.getId())));
        }
      }
    }
    return List.copyOf(responses);
  }

  @Override
  @Transactional
  public ExamDraftResponse create(SaveExamDraftRequest request) {
    var saved = drafts.create(request);
    log.info("Exam draft created: examId={}", saved.id());
    return saved;
  }

  @Override
  @Transactional(readOnly = true)
  public ExamDraftResponse getDraft(UUID examId) {
    var exam = access.requireOwned(examId);
    return projections.draft(exam, examItemRepository.findByExamIdOrderByPositionAsc(exam.getId()));
  }

  @Override
  @Transactional
  public ExamDraftResponse update(UUID examId, SaveExamDraftRequest request) {
    var exam = access.requireOwnedLocked(examId);
    var saved = drafts.update(exam, request);
    log.info("Exam draft updated: examId={}", saved.id());
    return saved;
  }

  @Override
  @Transactional
  public StaffExamSolutionResponse publish(UUID examId, PublishExamRequest request) {
    var exam = access.requireOwnedLocked(examId);
    var paper = publication.publish(exam, request);
    log.info("Exam published: examId={}, paperId={}", examId, paper.id());
    return paper;
  }

  @Override
  @Transactional(readOnly = true)
  public ExamPaperView preview(UUID examId, boolean solutions) {
    return reads.preview(examId, solutions);
  }

  @Override
  @Transactional(readOnly = true)
  public List<ExamPaperSummaryResponse> listPapers() {
    return reads.listPapers();
  }

  @Override
  @Transactional(readOnly = true)
  public ExamPaperView getPaper(UUID paperId, boolean solutions) {
    return reads.getPaper(paperId, solutions);
  }

  @Override
  @Transactional(readOnly = true)
  public ExamFigureDownload downloadFigure(UUID paperId, UUID assetId) {
    return reads.downloadFigure(paperId, assetId);
  }
}
