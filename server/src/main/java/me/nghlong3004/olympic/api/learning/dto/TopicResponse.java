package me.nghlong3004.olympic.api.learning.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for topic information.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Schema(description = "Topic information")
public record TopicResponse(
        @Schema(description = "Topic public UUID") UUID id,
        @Schema(description = "Parent subject UUID") UUID subjectId,
        @Schema(description = "Parent topic UUID (null if root)") UUID parentId,
        @Schema(description = "Topic name") String name,
        @Schema(description = "Description") String description,
        @Schema(description = "Display order") int displayOrder,
        @Schema(description = "Active status") boolean active,
        @Schema(description = "Creation time") Instant createdAt
) {}
