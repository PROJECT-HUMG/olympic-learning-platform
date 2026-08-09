package me.nghlong3004.olympic.assessment.service;

import java.util.UUID;

/**
 * Executes one queued assessment import outside the request thread.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public interface AssessmentImportProcessor {

  /**
   * Processes a queued import idempotently.
   *
   * @param importId import id
   */
  void process(UUID importId);
}
