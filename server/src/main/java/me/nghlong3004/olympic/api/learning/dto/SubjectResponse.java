package me.nghlong3004.olympic.api.learning.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for subject information.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Schema(description = "Subject information")
public record SubjectResponse(
        @Schema(description = "Subject public UUID") UUID id,
        @Schema(description = "Subject name") String name,
        @Schema(description = "Unique code") String code,
        @Schema(description = "Description") String description,
        @Schema(description = "Icon URL") String iconUrl,
        @Schema(description = "Display order") int displayOrder,
        @Schema(description = "Active status") boolean active,
        @Schema(description = "Creation time") Instant createdAt
) {}
