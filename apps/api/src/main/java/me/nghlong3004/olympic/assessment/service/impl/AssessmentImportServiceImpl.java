package me.nghlong3004.olympic.assessment.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.assessment.entity.AssessmentImport;
import me.nghlong3004.olympic.assessment.entity.AssessmentQuestionDraft;
import me.nghlong3004.olympic.assessment.enums.AssessmentDraftStatus;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportPhase;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportStatus;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentImportPageRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftAssetRepository;
import me.nghlong3004.olympic.assessment.repository.AssessmentQuestionDraftRepository;
import me.nghlong3004.olympic.assessment.request.UpdateAssessmentDraftRequest;
import me.nghlong3004.olympic.assessment.response.AssessmentImportStatusResponse;
import me.nghlong3004.olympic.assessment.response.AssessmentQuestionDraftResponse;
import me.nghlong3004.olympic.assessment.service.AssessmentImportQueue;
import me.nghlong3004.olympic.assessment.service.AssessmentImportService;
import me.nghlong3004.olympic.question.service.QuestionService;
import me.nghlong3004.olympic.assessment.properties.AssessmentImportProperties;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.mapper.FileMapper;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.user.repository.UserRepository;
import me.nghlong3004.olympic.user.enums.Role;
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

  private final AssessmentImportRepository importRepository;
  private final AssessmentQuestionDraftRepository draftRepository;
  private final AssessmentQuestionDraftAssetRepository assetRepository;
  private final AssessmentImportPageRepository pageRepository;
  private final FileRepository fileRepository;
  private final FileMapper fileMapper;
  private final StorageService storageService;
  private final AssessmentImportQueue queue;
  private final AssessmentImportProperties properties;
  private final CurrentUserProvider currentUserProvider;
  private final UserRepository userRepository;
  private final QuestionService questionService;

  @Override
  @Transactional
  public AssessmentImportStatusResponse create(MultipartFile file) {
    validateUpload(file);
    var currentUser = requireStaff();
    var uploaded = storageService.upload(file, StorageFolder.ASSESSMENT_SOURCE);
    var source = fileRepository.save(fileMapper.toEntity(uploaded, StorageFolder.ASSESSMENT_SOURCE));
    var assessmentImport = importRepository.save(AssessmentImport.builder()
        .sourceFile(source)
        .createdBy(userRepository.getReferenceById(currentUser.id()))
        .build());
    queue.enqueue(assessmentImport.getId());
    log.info("Assessment import queued: importId={}, userId={}", assessmentImport.getId(), currentUser.id());
    return toStatusResponse(assessmentImport);
  }

  @Override
  @Transactional(readOnly = true)
  public AssessmentImportStatusResponse getStatus(UUID id) {
    return toStatusResponse(requireImport(id));
  }

  @Override
  @Transactional(readOnly = true)
  public List<AssessmentQuestionDraftResponse> getDrafts(UUID id) {
    var assessmentImport = requireImport(id);
    return draftRepository.findByAssessmentImportIdOrderByOrdinalAsc(assessmentImport.getId()).stream()
        .map(this::toDraftResponse)
        .toList();
  }

  @Override
  @Transactional
  public AssessmentQuestionDraftResponse updateDraft(UUID importId, UUID draftId, UpdateAssessmentDraftRequest request) {
    var assessmentImport = requireImport(importId);
    var draft = draftRepository.findById(draftId)
        .filter(candidate -> candidate.getAssessmentImport().getId().equals(assessmentImport.getId()))
        .orElseThrow(() -> ErrorCode.RESOURCE_NOT_FOUND.throwIt());
    if (request.content() != null) draft.setContentJson(request.content());
    if (request.answer() != null) draft.setAnswerJson(request.answer());
    if (request.confidence() != null) draft.setConfidence(request.confidence());
    draft.setStatus(AssessmentDraftStatus.NEEDS_REVIEW);
    return toDraftResponse(draftRepository.save(draft));
  }

  @Override
  @Transactional
  public AssessmentQuestionDraftResponse approveDraft(UUID importId, UUID draftId) {
    var draft = requireDraft(importId, draftId);
    draft.setStatus(AssessmentDraftStatus.APPROVED);
    return toDraftResponse(draftRepository.save(draft));
  }

  @Override
  @Transactional
  public AssessmentQuestionDraftResponse rejectDraft(UUID importId, UUID draftId) {
    var draft = requireDraft(importId, draftId);
    draft.setStatus(AssessmentDraftStatus.REJECTED);
    return toDraftResponse(draftRepository.save(draft));
  }

  @Override
  @Transactional
  public void approveAll(UUID importId) {
    var assessmentImport = requireImport(importId);
    draftRepository.findByAssessmentImportIdOrderByOrdinalAsc(assessmentImport.getId()).forEach(draft -> draft.setStatus(AssessmentDraftStatus.APPROVED));
  }

  @Override
  @Transactional
  public AssessmentImportStatusResponse publish(UUID importId) { return questionService.publishImport(importId); }

  @Override
  @Transactional
  public AssessmentImportStatusResponse retry(UUID id) {
    var assessmentImport = requireImport(id);
    if (assessmentImport.getStatus() != AssessmentImportStatus.FAILED) {
      throw ErrorCode.INVALID_RESOURCE_NAME.throwIt("Only failed imports can be retried");
    }
    assessmentImport.setStatus(AssessmentImportStatus.QUEUED);
    assessmentImport.setPhase(AssessmentImportPhase.QUEUED);
    assessmentImport.setProgress(0);
    assessmentImport.setLastError(null);
    importRepository.save(assessmentImport);
    queue.enqueue(id);
    return toStatusResponse(assessmentImport);
  }

  private AssessmentImport requireImport(UUID id) {
    var currentUser = requireStaff();
    var result = currentUser.role() == Role.ADMIN
        ? importRepository.findById(id)
        : importRepository.findByIdAndCreatedById(id, currentUser.id());
    return result.orElseThrow(() -> ErrorCode.RESOURCE_NOT_FOUND.throwIt());
  }

  private CurrentUser requireStaff() {
    var currentUser = currentUserProvider.getCurrentUser();
    if (!(currentUser.role() == Role.ADMIN || currentUser.role() == Role.LECTURER)) {
      throw ErrorCode.ACCESS_DENIED.throwIt();
    }
    return currentUser;
  }

  private AssessmentQuestionDraft requireDraft(UUID importId, UUID draftId) {
    var assessmentImport = requireImport(importId);
    return draftRepository.findById(draftId)
        .filter(candidate -> candidate.getAssessmentImport().getId().equals(assessmentImport.getId()))
        .orElseThrow(() -> ErrorCode.RESOURCE_NOT_FOUND.throwIt());
  }

  private void validateUpload(MultipartFile file) {
    if (file == null || file.isEmpty() || file.getSize() > properties.maxFileSizeMb() * 1024L * 1024L) {
      throw ErrorCode.FILE_TOO_LARGE.throwIt();
    }
    var name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
    if (!name.endsWith(".pdf") && !"application/pdf".equalsIgnoreCase(file.getContentType())) {
      throw ErrorCode.FILE_TYPE_NOT_ALLOWED.throwIt("Only PDF files are supported");
    }
  }

  private AssessmentImportStatusResponse toStatusResponse(AssessmentImport value) {
    return new AssessmentImportStatusResponse(value.getId(), value.getStatus(), value.getPhase(), value.getProgress(),
        value.getTotalPages(), value.getProcessedPages(), value.getDraftCount(), value.getWarningCount(),
        value.getLastError(), value.getCreatedAt(), value.getUpdatedAt());
  }

  private AssessmentQuestionDraftResponse toDraftResponse(AssessmentQuestionDraft draft) {
    var assets = assetRepository.findByDraftIdOrderBySortOrderAsc(draft.getId()).stream()
        .map(asset -> new AssessmentQuestionDraftResponse.AssessmentDraftAssetResponse(
            asset.getId(), asset.getRole().name(), storageService.getDownloadUri(asset.getFile().getStorageKey()).toString(),
            asset.getAltText(), asset.getCropJson()))
        .toList();
    var sourcePageUrl = draft.getSourcePage() == null ? null : pageRepository
        .findByAssessmentImportIdAndPageNumber(draft.getAssessmentImport().getId(), draft.getSourcePage())
        .map(page -> storageService.getDownloadUri(page.getFile().getStorageKey()).toString())
        .orElse(null);
    return new AssessmentQuestionDraftResponse(draft.getId(), draft.getOrdinal(), draft.getStatus(), draft.getContentJson(),
        draft.getAnswerJson(), draft.getConfidence(), draft.getWarningsJson(), draft.getSourcePage(), draft.getSourceBbox(), sourcePageUrl, assets);
  }
}
