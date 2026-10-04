package me.nghlong3004.olympic.daily.response;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record DailyPlanResponse(
    UUID id,
    UUID ownerId,
    LocalDate planDate,
    OffsetDateTime firstSubmittedAt,
    boolean onTime,
    String reviewReasons,
    String reviewWentWell,
    String reviewTomorrow,
    List<DailyTaskResponse> tasks,
    int completedCount,
    int totalCount,
    int mustCompleted,
    int mustTotal,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    long version) {}
