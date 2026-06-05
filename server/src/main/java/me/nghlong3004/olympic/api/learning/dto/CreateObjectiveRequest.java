package me.nghlong3004.olympic.api.learning.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Request DTO for creating a learning objective.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Schema(description = "Create learning objective request")
public record CreateObjectiveRequest(
        @NotNull(message = "Topic ID is required")
        @Schema(description = "UUID of the parent topic")
        UUID topicId,

        @NotBlank(message = "Objective code is required")
        @Size(min = 2, max = 50, message = "Code must be 2-50 characters")
        @Schema(description = "Unique objective code", example = "MATH-LA-01")
        String code,

        @NotBlank(message = "Description is required")
        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        @Schema(description = "Objective description", example = "Understand matrix multiplication")
        String description,

        @Pattern(
                regexp = "^(REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE)$",
                message = "Bloom level must be one of: REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE"
        )
        @Schema(description = "Bloom's taxonomy level", example = "UNDERSTAND")
        String bloomLevel
) {}
