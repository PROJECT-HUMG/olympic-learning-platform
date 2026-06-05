package me.nghlong3004.olympic.api.learning.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating a learning objective.
 *
 * <p>All fields are optional — only non-null fields are applied.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Schema(description = "Update learning objective request (partial update)")
public record UpdateObjectiveRequest(
        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        @Schema(description = "New description (optional)")
        String description,

        @Pattern(
                regexp = "^(REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE)$",
                message = "Bloom level must be one of: REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE"
        )
        @Schema(description = "New Bloom's taxonomy level (optional)")
        String bloomLevel
) {}
