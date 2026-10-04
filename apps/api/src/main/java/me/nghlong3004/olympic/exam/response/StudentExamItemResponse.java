package me.nghlong3004.olympic.exam.response;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * Student item. This record has no answer or explanation fields.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public record StudentExamItemResponse(
    @Schema(description = "Question identifier") UUID questionId,
    @Schema(description = "Item points") BigDecimal points,
    @Schema(description = "Per-part weights") Map<String, BigDecimal> partPoints,
    @Schema(description = "Placement instructions") String instructions,
    @Schema(description = "Visible schemaVersion 1 content") JsonNode content) {}
