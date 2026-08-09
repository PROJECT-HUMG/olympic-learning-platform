package me.nghlong3004.olympic.assessment.service;

import me.nghlong3004.olympic.assessment.dto.AssessmentPage;
import me.nghlong3004.olympic.assessment.dto.ParsedAssessmentPage;

/**
 * Provider-neutral contract for extracting structured questions from a rendered page.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public interface VisionQuestionParser {

  /**
   * Parses one page and returns structured question candidates.
   *
   * @param page rendered page and optional text layer
   * @return parsed candidates with confidence and source regions
   */
  ParsedAssessmentPage parse(AssessmentPage page);
}
