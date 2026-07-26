package me.nghlong3004.olympic.document.response;

import java.util.List;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
public record DocumentMetadataResponse(
    List<CategorySummaryResponse> categories,
    List<SubjectSummaryResponse> subjects,
    List<TagSummaryResponse> tags
) {}
