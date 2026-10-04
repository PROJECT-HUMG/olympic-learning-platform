package me.nghlong3004.olympic.daily.sharing.response;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Permitted selected-day counts. This is absent when the member has not shared with the viewer.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record SharedDailySummaryResponse(
    UUID planId,
    OffsetDateTime firstSubmittedAt,
    boolean onTime,
    int completedCount,
    int totalCount,
    int mustCompleted,
    int mustTotal) {}
