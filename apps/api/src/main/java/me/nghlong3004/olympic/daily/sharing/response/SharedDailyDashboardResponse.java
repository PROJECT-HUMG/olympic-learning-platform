package me.nghlong3004.olympic.daily.sharing.response;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Selected-day dashboard for one accountability group.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record SharedDailyDashboardResponse(
    UUID groupId, LocalDate date, List<SharedDailyMemberResponse> members) {}
