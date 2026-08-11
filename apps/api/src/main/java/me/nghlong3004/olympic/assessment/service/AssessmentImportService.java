package me.nghlong3004.olympic.assessment.service;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.assessment.request.UpdateAssessmentDraftRequest;
import me.nghlong3004.olympic.assessment.response.AssessmentImportStatusResponse;
import me.nghlong3004.olympic.assessment.response.AssessmentQuestionDraftResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * Coordinates assessment PDF imports, background parsing and lecturer review.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public interface AssessmentImportService {

  /**
   * Stores a PDF and queues an asynchronous parsing job.
   *
   * @param file uploaded PDF
   * @return queued import status
   */
  AssessmentImportStatusResponse create(MultipartFile file);

  /**
   * Returns an import status visible to its owner or an administrator.
   *
   * @param id import id
   * @return current status
   */
  AssessmentImportStatusResponse getStatus(UUID id);

  /**
   * Returns parsed question drafts visible to the import owner or an administrator.
   *
   * @param id import id
   * @return drafts in source order
   */
  List<AssessmentQuestionDraftResponse> getDrafts(UUID id);

  /**
   * Updates a draft during human review.
   *
   * @param importId import id
   * @param draftId draft id
   * @param request edited draft payload
   * @return updated draft
   */
  AssessmentQuestionDraftResponse updateDraft(UUID importId, UUID draftId, UpdateAssessmentDraftRequest request);

  /**
   * Approves a draft while its import is awaiting review.
   *
   * @param importId import identifier
   * @param draftId draft identifier
   * @return approved draft
   */
  AssessmentQuestionDraftResponse approveDraft(UUID importId, UUID draftId);

  /**
   * Rejects a draft so publication will skip it.
   *
   * @param importId import identifier
   * @param draftId draft identifier
   * @return rejected draft
   */
  AssessmentQuestionDraftResponse rejectDraft(UUID importId, UUID draftId);

  /**
   * Approves drafts still awaiting review and preserves explicitly rejected drafts.
   *
   * @param importId import identifier
   */
  void approveAll(UUID importId);

  /**
   * Atomically publishes approved drafts and skips rejected drafts.
   *
   * @param importId import identifier
   * @return published import status
   */
  AssessmentImportStatusResponse publish(UUID importId);

  /**
   * Requeues a failed import using its already stored source PDF.
   *
   * @param id import id
   * @return queued status
   */
  AssessmentImportStatusResponse retry(UUID id);
}
