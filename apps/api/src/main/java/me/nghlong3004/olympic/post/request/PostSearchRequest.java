package me.nghlong3004.olympic.post.request;

import io.swagger.v3.oas.annotations.media.Schema;
import me.nghlong3004.olympic.post.enums.PostStatus;
import me.nghlong3004.olympic.post.enums.PostType;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/07/2026
 */
public record PostSearchRequest(
    @Schema(description = "Search by title keyword") String keyword,
    @Schema(description = "Filter by post type") PostType type,
    @Schema(description = "Filter by post status") PostStatus status
) {}
