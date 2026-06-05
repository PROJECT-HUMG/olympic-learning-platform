package me.nghlong3004.olympic.api.learning.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Request DTO for creating a topic within a subject.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Schema(description = "Create topic request")
public record CreateTopicRequest(
        @NotNull(message = "Subject ID is required")
        @Schema(description = "UUID of the parent subject")
        UUID subjectId,

        @Schema(description = "UUID of the parent topic (null for root topics)")
        UUID parentId,

        @NotBlank(message = "Topic name is required")
        @Size(min = 2, max = 255, message = "Name must be 2-255 characters")
        @Schema(description = "Topic name", example = "Đại số tuyến tính")
        String name,

        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        @Schema(description = "Topic description")
        String description
) {}
