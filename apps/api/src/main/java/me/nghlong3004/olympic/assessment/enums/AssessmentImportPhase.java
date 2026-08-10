package me.nghlong3004.olympic.assessment.enums;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public enum AssessmentImportPhase {
  QUEUED,
  RENDERING_PAGES,
  EXTRACTING_TEXT,
  PARSING_QUESTIONS,
  CROPPING_ASSETS,
  SAVING_DRAFTS,
  REVIEW_REQUIRED,
  PUBLISHED,
  FAILED
}
