package me.nghlong3004.olympic.assessment.dto;

import java.util.List;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public record ParsedAssessmentPage(int pageNumber, List<ParsedQuestion> questions) {}
