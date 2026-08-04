package me.nghlong3004.olympic.post.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.UUID;
import me.nghlong3004.olympic.post.enums.PostStatus;
import me.nghlong3004.olympic.post.enums.PostType;

import lombok.Builder;
import me.nghlong3004.olympic.user.response.UserResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/04/2026
 */
@Builder(toBuilder = true)
public record PostSummaryResponse(
    @Schema(example = "123e4567-e89b-12d3-a456-426614174000")
    UUID id,

    @Schema(example = "Olympic Games 2026")
    String title,

    @Schema(example = "olympic-games-2026")
    String slug,

    @Schema(example = "Summary of the post")
    String summary,

    @Schema(example = "NEWS")
    PostType type,

    @Schema(example = "PUBLISHED")
    PostStatus status,

    @Schema(example = "2026-08-04T15:00:00Z")
    OffsetDateTime publishedAt,

    @Schema(example = "100")
    Long viewCount,

    String thumbnailUrl,

    UserResponse author
) {}
