package me.nghlong3004.olympic.post.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.UUID;
import me.nghlong3004.olympic.post.enums.PostStatus;
import me.nghlong3004.olympic.post.enums.PostType;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/04/2026
 */
public record CreatePostRequest(
    @Schema(example = "Olympic Games 2026")
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    String title,

    @Schema(example = "Summary of the post")
    String summary,

    @Schema(example = "<p>Post content here</p>")
    @NotBlank(message = "Content is required")
    String content,

    @Schema(example = "123e4567-e89b-12d3-a456-426614174000")
    UUID thumbnailId,

    @Schema(example = "NEWS")
    @NotNull(message = "Post type is required")
    PostType type,

    @Schema(example = "PUBLISHED")
    @NotNull(message = "Post status is required")
    PostStatus status,

    @Schema(example = "2026-08-04T15:00:00Z")
    OffsetDateTime publishedAt,

    @Schema(example = "2026-12-31T23:59:59Z")
    OffsetDateTime expiredAt
) {}
