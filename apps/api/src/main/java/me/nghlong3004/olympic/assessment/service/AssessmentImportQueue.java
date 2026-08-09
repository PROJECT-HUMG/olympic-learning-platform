package me.nghlong3004.olympic.assessment.service;

import java.util.UUID;

/**
 * Durable queue abstraction for assessment import jobs.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public interface AssessmentImportQueue {

  /**
   * Enqueues an import id for background processing.
   *
   * @param importId import id
   */
  void enqueue(UUID importId);
}
