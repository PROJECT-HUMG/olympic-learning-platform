package me.nghlong3004.olympic.exam.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * Draft placement. It does not carry bank content, answers, or explanations.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public record ExamItemResponse(
    @Schema(description = "Question identifier") UUID questionId,
    @Schema(description = "Item points") BigDecimal points,
    @Schema(description = "Per-part weights") Map<String, BigDecimal> partPoints,
    @Schema(description = "Placement instructions") String instructions) {}
