package me.nghlong3004.olympic.daily.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Rates are computed from the owner's plans. Null completionRate means no nonempty day. Null
 * mustRate means no MUST task. Neither value is a weighted score.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record DailyWeekResponse(
    UUID id,
    LocalDate weekStart,
    String recurringUnfinished,
    String issues,
    String reflection,
    String nextWeekChanges,
    int plannedDays,
    int weekDays,
    int nonemptyDays,
    BigDecimal completionRate,
    long mustCompleted,
    long mustTotal,
    BigDecimal mustRate,
    long onTimeDays,
    Long version) {}
