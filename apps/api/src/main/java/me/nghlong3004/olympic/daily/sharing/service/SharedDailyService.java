package me.nghlong3004.olympic.daily.sharing.service;

import java.time.LocalDate;
import java.util.UUID;
import me.nghlong3004.olympic.daily.response.DailyPlanResponse;
import me.nghlong3004.olympic.daily.response.DailyWeekResponse;
import me.nghlong3004.olympic.daily.sharing.response.SharedDailyDashboardResponse;

/**
 * Selected-day and week reads for Daily material an accountability group may currently see.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public interface SharedDailyService {

  /**
   * Lists active members for one platform date. A member the viewer cannot currently read has
   * access NOT_SHARED and a null summary, whether or not that member has a private plan.
   *
   * @param groupId accountability group
   * @param date selected platform date
   * @return dashboard for that date
   */
  SharedDailyDashboardResponse dashboard(UUID groupId, LocalDate date);

  /**
   * Returns one owner's plan in the owner response shape after the current group gate.
   *
   * @param groupId accountability group
   * @param ownerId plan owner
   * @param date platform date
   * @return saved plan
   */
  DailyPlanResponse readPlan(UUID groupId, UUID ownerId, LocalDate date);

  /**
   * Returns one owner's week in the owner response shape. The date is normalized to Monday.
   * Aggregates use the same counts as the owner week read, including days whose task list is empty.
   *
   * @param groupId accountability group
   * @param ownerId week owner
   * @param date any platform date inside the week
   * @return week aggregate and saved reflection
   */
  DailyWeekResponse readWeek(UUID groupId, UUID ownerId, LocalDate date);
}
