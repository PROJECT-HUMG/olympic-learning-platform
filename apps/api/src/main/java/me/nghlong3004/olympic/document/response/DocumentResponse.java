package me.nghlong3004.olympic.document.response;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;
import me.nghlong3004.olympic.user.response.UserResponse;

import lombok.Builder;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@Builder(toBuilder = true)
public record DocumentResponse(
    UUID id,
    String title,
    String slug,
    String description,
    long viewCount,
    long downloadCount,
    String downloadUrl,
    String thumbnailUrl,
    CategorySummaryResponse category,
    SubjectSummaryResponse subject,
    Set<TagSummaryResponse> tags,
    UserResponse owner,
    OffsetDateTime createdAt) {}
