package me.nghlong3004.olympic.api.learning.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for learning objective information.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Schema(description = "Learning objective information")
public record ObjectiveResponse(
        @Schema(description = "Objective public UUID") UUID id,
        @Schema(description = "Parent topic UUID") UUID topicId,
        @Schema(description = "Unique code") String code,
        @Schema(description = "Description") String description,
        @Schema(description = "Bloom's taxonomy level") String bloomLevel,
        @Schema(description = "Creation time") Instant createdAt
) {}
