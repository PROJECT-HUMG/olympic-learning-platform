package me.nghlong3004.olympic.assessment.service;

import java.util.UUID;
import me.nghlong3004.olympic.assessment.response.AssessmentImportStatusResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public interface AssessmentPublicationService {

  /**
   * Atomically publishes approved drafts, skips rejected drafts and blocks unfinished review.
   * Repeated calls for an already published import are idempotent.
   *
   * @param importId assessment import identifier
   * @return published import status
   */
  AssessmentImportStatusResponse publish(UUID importId);
}
