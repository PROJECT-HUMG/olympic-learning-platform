package me.nghlong3004.olympic.daily.service;

import java.time.LocalDate;
import java.util.UUID;
import me.nghlong3004.olympic.daily.request.SaveDailyPlanRequest;
import me.nghlong3004.olympic.daily.request.SaveDailyWeekRequest;
import me.nghlong3004.olympic.daily.response.DailyPlanResponse;
import me.nghlong3004.olympic.daily.response.DailyWeekResponse;

/**
 * Personal Daily plans for the authenticated owner.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public interface DailyService {

  /**
   * Returns the caller's plan for the platform date.
   *
   * @param date platform calendar date
   * @return owned plan
   */
  DailyPlanResponse getPlan(LocalDate date);

  /**
   * Creates or updates the caller's plan. Owner and date stay fixed, and the first submission
   * timestamp is left unchanged.
   *
   * @param date platform calendar date
   * @param request tasks and daily reflection
   * @return saved plan
   */
  DailyPlanResponse savePlan(LocalDate date, SaveDailyPlanRequest request);

  /**
   * Records the first server submission timestamp once. A later call does not replace it.
   *
   * @param planId owned plan id
   * @return plan with the original timestamp
   */
  DailyPlanResponse submitPlan(UUID planId);

  /**
   * Returns the caller's Monday week aggregate and reflection.
   *
   * @param date any platform date inside the week
   * @return week read model
   */
  DailyWeekResponse getWeek(LocalDate date);

  /**
   * Creates or updates the caller's weekly reflection for the Monday of the given date.
   *
   * @param date any platform date inside the week
   * @param request plain-text reflection
   * @return week read model
   */
  DailyWeekResponse saveWeek(LocalDate date, SaveDailyWeekRequest request);
}
