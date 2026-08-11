package me.nghlong3004.olympic.assessment.service.impl;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.assessment.entity.AssessmentImport;
import me.nghlong3004.olympic.assessment.entity.AssessmentQuestionDraft;
import me.nghlong3004.olympic.assessment.entity.AssessmentQuestionDraftAsset;
import me.nghlong3004.olympic.assessment.enums.AssessmentDraftStatus;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportPhase;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportStatus;
import me.nghlong3004.olympic.assessment.mapper.AssessmentImportMapper;
import me.nghlong3004.olympic.assessment.properties.AssessmentImportProperties;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportPageRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftAssetRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftRepository;
import me.nghlong3004.olympic.assessment.request.UpdateAssessmentDraftRequest;
import me.nghlong3004.olympic.assessment.response.AssessmentImportStatusResponse;
import me.nghlong3004.olympic.assessment.response.AssessmentQuestionDraftResponse;
import me.nghlong3004.olympic.assessment.service.AssessmentImportQueue;
import me.nghlong3004.olympic.assessment.service.AssessmentImportService;
import me.nghlong3004.olympic.assessment.service.AssessmentPublicationService;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.mapper.FileMapper;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AssessmentImportServiceImpl implements AssessmentImportService {
  private static final long BYTES_PER_MEGABYTE = 1024L * 1024L;

  private final AssessmentImportRepository importRepository;
  private final AssessmentQuestionDraftRepository draftRepository;
  private final AssessmentQuestionDraftAssetRepository assetRepository;
  private final AssessmentImportPageRepository pageRepository;
  private final FileRepository fileRepository;
  private final FileMapper fileMapper;
  private final AssessmentImportMapper assessmentImportMapper;
  private final StorageService storageService;
  private final AssessmentImportQueue queue;
  private final AssessmentImportProperties properties;
  private final CurrentUserProvider currentUserProvider;
  private final UserRepository userRepository;
  private final AssessmentPublicationService assessmentPublicationService;

  @Transactional
  @Override
  public AssessmentImportStatusResponse create(MultipartFile file) {
    validateUpload(file);
    var currentUser = requireStaff();
    var uploaded = storageService.upload(file, StorageFolder.ASSESSMENT_SOURCE);
    var source = fileRepository.save(fileMapper.toEntity(uploaded, StorageFolder.ASSESSMENT_SOURCE));
    var assessmentImport =
        importRepository.save(
            AssessmentImport.builder()
                .sourceFile(source)
                .createdBy(userRepository.getReferenceById(currentUser.id()))
                .build());
    queue.enqueue(assessmentImport.getId());
    log.info(
        "Assessment import queued: importId={}, userId={}",
        assessmentImport.getId(),
        currentUser.id());
    return assessmentImportMapper.toStatusResponse(assessmentImport);
  }

  @Transactional(readOnly = true)
  @Override
  public AssessmentImportStatusResponse getStatus(UUID id) {
    return assessmentImportMapper.toStatusResponse(requireImport(id));
  }

  @Transactional(readOnly = true)
  @Override
  public List<AssessmentQuestionDraftResponse> getDrafts(UUID id) {
    var assessmentImport = requireImport(id);
    var drafts =
        draftRepository.findByAssessmentImportIdOrderByOrdinalAsc(assessmentImport.getId());
    if (drafts.isEmpty()) {
      return List.of();
    }
    var assetsByDraftId =
        assetRepository
            .findByDraftIdInOrderByDraftIdAscSortOrderAsc(
                drafts.stream().map(AssessmentQuestionDraft::getId).toList())
            .stream()
            .collect(Collectors.groupingBy(asset -> asset.getDraft().getId()));
    var pageUrls = findPageUrls(assessmentImport.getId());
    return drafts.stream()
        .map(
            draft ->
                toDraftResponse(
                    draft,
                    assetsByDraftId.getOrDefault(draft.getId(), List.of()),
                    pageUrls.get(draft.getSourcePage())))
        .toList();
  }

  @Transactional
  @Override
  public AssessmentQuestionDraftResponse updateDraft(
      UUID importId, UUID draftId, UpdateAssessmentDraftRequest request) {
    var assessmentImport = requireReviewableImportForUpdate(importId);
    var draft =
        draftRepository
            .findById(draftId)
            .filter(
                candidate ->
                    candidate.getAssessmentImport().getId().equals(assessmentImport.getId()))
            .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (request.content() != null) {
      draft.setContentJson(request.content());
    }
    if (request.answer() != null) {
      draft.setAnswerJson(request.answer());
    }
    if (request.confidence() != null) {
      draft.setConfidence(request.confidence());
    }
    draft.setStatus(AssessmentDraftStatus.NEEDS_REVIEW);
    var saved = draftRepository.save(draft);
    log.info("Assessment draft updated: importId={}, draftId={}", importId, draftId);
    return toDraftResponse(saved);
  }

  @Transactional
  @Override
  public AssessmentQuestionDraftResponse approveDraft(UUID importId, UUID draftId) {
    var draft = requireReviewableDraftForUpdate(importId, draftId);
    draft.setStatus(AssessmentDraftStatus.APPROVED);
    var saved = draftRepository.save(draft);
    log.info("Assessment draft approved: importId={}, draftId={}", importId, draftId);
    return toDraftResponse(saved);
  }

  @Transactional
  @Override
  public AssessmentQuestionDraftResponse rejectDraft(UUID importId, UUID draftId) {
    var draft = requireReviewableDraftForUpdate(importId, draftId);
    draft.setStatus(AssessmentDraftStatus.REJECTED);
    var saved = draftRepository.save(draft);
    log.info("Assessment draft rejected: importId={}, draftId={}", importId, draftId);
    return toDraftResponse(saved);
  }

  @Transactional
  @Override
  public void approveAll(UUID importId) {
    var assessmentImport = requireReviewableImportForUpdate(importId);
    var drafts = draftRepository.findByAssessmentImportIdOrderByOrdinalAsc(assessmentImport.getId());
    drafts.stream()
        .filter(draft -> draft.getStatus() == AssessmentDraftStatus.NEEDS_REVIEW)
        .forEach(draft -> draft.setStatus(AssessmentDraftStatus.APPROVED));
    log.info("Assessment drafts approved: importId={}", importId);
  }

  @Override
  public AssessmentImportStatusResponse publish(UUID importId) {
    return assessmentPublicationService.publish(importId);
  }

  @Transactional
  @Override
  public AssessmentImportStatusResponse retry(UUID id) {
    var assessmentImport = requireOwnedImportForUpdate(id);
    if (assessmentImport.getStatus() != AssessmentImportStatus.FAILED) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt("Only failed imports can be retried");
    }
    assessmentImport.setStatus(AssessmentImportStatus.QUEUED);
    assessmentImport.setPhase(AssessmentImportPhase.QUEUED);
    assessmentImport.setProgress(0);
    assessmentImport.setLastError(null);
    importRepository.save(assessmentImport);
    queue.enqueue(id);
    log.info("Assessment import requeued: importId={}", id);
    return assessmentImportMapper.toStatusResponse(assessmentImport);
  }

  private AssessmentImport requireImport(UUID id) {
    var currentUser = requireStaff();
    var result =
        currentUser.role() == Role.ADMIN
            ? importRepository.findById(id)
            : importRepository.findByIdAndCreatedById(id, currentUser.id());
    return result.orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
  }

  private CurrentUser requireStaff() {
    var currentUser = currentUserProvider.getCurrentUser();
    if (currentUser.role() != Role.ADMIN && currentUser.role() != Role.LECTURER) {
      throw ErrorCode.ACCESS_DENIED.throwIt();
    }
    return currentUser;
  }

  private AssessmentQuestionDraft requireReviewableDraftForUpdate(UUID importId, UUID draftId) {
    var assessmentImport = requireReviewableImportForUpdate(importId);
    return draftRepository
        .findById(draftId)
        .filter(candidate -> candidate.getAssessmentImport().getId().equals(assessmentImport.getId()))
        .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
  }

  private AssessmentImport requireReviewableImportForUpdate(UUID id) {
    var assessmentImport = requireOwnedImportForUpdate(id);
    if (assessmentImport.getStatus() != AssessmentImportStatus.REVIEW_REQUIRED) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt(
          "Only imports awaiting review can be changed");
    }
    return assessmentImport;
  }

  private AssessmentImport requireOwnedImportForUpdate(UUID id) {
    var currentUser = requireStaff();
    var assessmentImport =
        importRepository
            .findForUpdateById(id)
            .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (currentUser.role() != Role.ADMIN
        && !assessmentImport.getCreatedBy().getId().equals(currentUser.id())) {
      throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
    }
    return assessmentImport;
  }

  private void validateUpload(MultipartFile file) {
    if (file == null
        || file.isEmpty()
        || file.getSize() > properties.maxFileSizeMb() * BYTES_PER_MEGABYTE) {
      throw ErrorCode.FILE_TOO_LARGE.throwIt();
    }
    var name =
        file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
    if (!name.endsWith(".pdf") && !"application/pdf".equalsIgnoreCase(file.getContentType())) {
      throw ErrorCode.FILE_TYPE_NOT_ALLOWED.throwIt("Only PDF files are supported");
    }
  }

  private AssessmentQuestionDraftResponse toDraftResponse(AssessmentQuestionDraft draft) {
    var sourcePageUrl =
        draft.getSourcePage() == null
            ? null
            : pageRepository
                .findByAssessmentImportIdAndPageNumber(
                    draft.getAssessmentImport().getId(), draft.getSourcePage())
                .map(page -> downloadUrl(page.getFile().getStorageKey()))
                .orElse(null);
    return toDraftResponse(
        draft, assetRepository.findByDraftIdOrderBySortOrderAsc(draft.getId()), sourcePageUrl);
  }

  private AssessmentQuestionDraftResponse toDraftResponse(
      AssessmentQuestionDraft draft,
      List<AssessmentQuestionDraftAsset> draftAssets,
      String sourcePageUrl) {
    var assets =
        draftAssets.stream()
        .map(
            asset ->
                assessmentImportMapper.toDraftAssetResponse(
                    asset, downloadUrl(asset.getFile().getStorageKey())))
        .toList();
    return assessmentImportMapper.toDraftResponse(draft, sourcePageUrl, assets);
  }

  private Map<Integer, String> findPageUrls(UUID importId) {
    return pageRepository.findByAssessmentImportIdOrderByPageNumberAsc(importId).stream()
        .collect(
            Collectors.toMap(
                page -> page.getPageNumber(),
                page -> downloadUrl(page.getFile().getStorageKey())));
  }

  private String downloadUrl(String storageKey) {
    return storageService.getDownloadUri(storageKey).toString();
  }
}
