package me.nghlong3004.olympic.api.learning.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating a subject.
 *
 * <p>All fields are optional — only non-null fields are applied.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Schema(description = "Update subject request (partial update)")
public record UpdateSubjectRequest(
        @Size(min = 2, max = 255, message = "Name must be 2-255 characters")
        @Schema(description = "New name (optional)")
        String name,

        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        @Schema(description = "New description (optional)")
        String description,

        @Size(max = 500, message = "Icon URL must not exceed 500 characters")
        @Schema(description = "New icon URL (optional)")
        String iconUrl,

        @Schema(description = "Display order (optional)")
        Integer displayOrder
) {}
