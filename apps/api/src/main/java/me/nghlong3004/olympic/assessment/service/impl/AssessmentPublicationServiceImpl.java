package me.nghlong3004.olympic.assessment.service.impl;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.assessment.entity.AssessmentImport;
import me.nghlong3004.olympic.assessment.entity.AssessmentQuestionDraftAsset;
import me.nghlong3004.olympic.assessment.enums.AssessmentDraftStatus;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportPhase;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportStatus;
import me.nghlong3004.olympic.assessment.mapper.AssessmentImportMapper;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftAssetRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftRepository;
import me.nghlong3004.olympic.assessment.response.AssessmentImportStatusResponse;
import me.nghlong3004.olympic.assessment.service.AssessmentPublicationService;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.question.service.QuestionImportService;
import me.nghlong3004.olympic.user.enums.Role;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AssessmentPublicationServiceImpl implements AssessmentPublicationService {
  private final AssessmentImportRepository importRepository;
  private final AssessmentQuestionDraftRepository draftRepository;
  private final AssessmentQuestionDraftAssetRepository draftAssetRepository;
  private final QuestionImportService questionImportService;
  private final CurrentUserProvider currentUserProvider;
  private final AssessmentImportMapper assessmentImportMapper;

  @Transactional
  @Override
  public AssessmentImportStatusResponse publish(UUID importId) {
    var assessmentImport = requireOwnedImportForUpdate(importId);
    if (assessmentImport.getStatus() == AssessmentImportStatus.PUBLISHED) {
      return assessmentImportMapper.toStatusResponse(assessmentImport);
    }
    if (assessmentImport.getStatus() != AssessmentImportStatus.REVIEW_REQUIRED) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt(
          "Only imports awaiting review can be published");
    }

    var drafts = draftRepository.findByAssessmentImportIdOrderByOrdinalAsc(importId);
    if (drafts.stream().anyMatch(draft -> draft.getStatus() == AssessmentDraftStatus.NEEDS_REVIEW)) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt(
          "All drafts must be approved or rejected before publishing");
    }
    var approvedDrafts =
        drafts.stream()
            .filter(draft -> draft.getStatus() == AssessmentDraftStatus.APPROVED)
            .toList();
    if (approvedDrafts.isEmpty()) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("At least one approved question is required");
    }
    var assetsByDraftId =
        findAssetsByDraftId(approvedDrafts.stream().map(draft -> draft.getId()).toList());
    var approved =
        approvedDrafts.stream()
            .map(
                draft ->
                    assessmentImportMapper.toImportedQuestion(
                        draft,
                        assessmentImport.getCreatedBy().getId(),
                        assetsByDraftId.getOrDefault(draft.getId(), List.of()).stream()
                            .map(assessmentImportMapper::toImportedAsset)
                            .toList()))
            .toList();

    questionImportService.publishAll(approved);
    assessmentImport.setStatus(AssessmentImportStatus.PUBLISHED);
    assessmentImport.setPhase(AssessmentImportPhase.PUBLISHED);
    assessmentImport.setProgress(100);
    var saved = importRepository.save(assessmentImport);
    log.info(
        "Assessment import published: importId={}, questionCount={}", importId, approved.size());
    return assessmentImportMapper.toStatusResponse(saved);
  }

  private AssessmentImport requireOwnedImportForUpdate(UUID importId) {
    var currentUser = currentUserProvider.getCurrentUser();
    if (currentUser.role() != Role.ADMIN && currentUser.role() != Role.LECTURER) {
      throw ErrorCode.ACCESS_DENIED.throwIt();
    }
    var assessmentImport =
        importRepository
            .findForUpdateById(importId)
            .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (currentUser.role() != Role.ADMIN
        && !assessmentImport.getCreatedBy().getId().equals(currentUser.id())) {
      throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
    }
    return assessmentImport;
  }

  private Map<UUID, List<AssessmentQuestionDraftAsset>> findAssetsByDraftId(List<UUID> draftIds) {
    return draftAssetRepository.findByDraftIdInOrderByDraftIdAscSortOrderAsc(draftIds).stream()
        .collect(Collectors.groupingBy(asset -> asset.getDraft().getId()));
  }
}
