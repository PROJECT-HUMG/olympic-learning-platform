package me.nghlong3004.olympic.daily.response;

import java.util.UUID;
import me.nghlong3004.olympic.daily.enums.DailyTaskPriority;
import me.nghlong3004.olympic.daily.enums.DailyTaskStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record DailyTaskResponse(
    UUID id, String title, DailyTaskPriority priority, DailyTaskStatus status, int position) {}
