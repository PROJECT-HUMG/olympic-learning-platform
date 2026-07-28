package me.nghlong3004.olympic.document.request;

import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Payload for searching documents.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@Schema(name = "DocumentSearchRequest", description = "Payload for searching documents with filters")
public record DocumentSearchRequest(
    @Schema(description = "Keyword to search in title or description", example = "Toán")
        String keyword,

    @Schema(description = "Filter by category ID")
        UUID categoryId,

    @Schema(description = "Filter by subject ID")
        UUID subjectId,

    @Schema(description = "Filter by tag IDs")
        List<UUID> tagIds,

    @Schema(description = "Filter by owner ID")
        UUID ownerId) {}
