package me.nghlong3004.olympic.daily.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Schema(description = "Owner weekly reflection. The week key is the Monday of weekStart.")
public record SaveDailyWeekRequest(
    Long expectedVersion,
    @Size(max = 4000) String recurringUnfinished,
    @Size(max = 4000) String issues,
    @Size(max = 4000) String reflection,
    @Size(max = 4000) String nextWeekChanges) {}
