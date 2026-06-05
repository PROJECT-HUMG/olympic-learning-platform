package me.nghlong3004.olympic.api.learning.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating a subject.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Schema(description = "Create subject request")
public record CreateSubjectRequest(
        @NotBlank(message = "Subject name is required")
        @Size(min = 2, max = 255, message = "Name must be 2-255 characters")
        @Schema(description = "Subject name", example = "Toán học")
        String name,

        @NotBlank(message = "Subject code is required")
        @Size(min = 2, max = 50, message = "Code must be 2-50 characters")
        @Schema(description = "Unique subject code", example = "MATH")
        String code,

        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        @Schema(description = "Subject description")
        String description,

        @Size(max = 500, message = "Icon URL must not exceed 500 characters")
        @Schema(description = "Icon URL for the subject")
        String iconUrl
) {}
