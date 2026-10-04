package me.nghlong3004.olympic.daily.feedback.response;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record DailyFeedbackContributionResponse(
    UUID id,
    UUID authorId,
    String authorDisplayName,
    String text,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    long version) {}
