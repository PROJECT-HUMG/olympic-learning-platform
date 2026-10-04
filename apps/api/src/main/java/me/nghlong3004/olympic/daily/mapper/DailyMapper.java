package me.nghlong3004.olympic.daily.mapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import me.nghlong3004.olympic.daily.entity.DailyPlan;
import me.nghlong3004.olympic.daily.entity.DailyTask;
import me.nghlong3004.olympic.daily.entity.DailyWeeklyReview;
import me.nghlong3004.olympic.daily.response.DailyPlanResponse;
import me.nghlong3004.olympic.daily.response.DailyTaskResponse;
import me.nghlong3004.olympic.daily.response.DailyWeekResponse;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

/**
 * Structural projections of authorized Daily rows and service-computed statistics.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/04/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface DailyMapper {
  DailyTaskResponse toTask(DailyTask task);

  default DailyPlanResponse toPlan(
      DailyPlan plan, List<DailyTaskResponse> tasks, boolean onTime,
      int completed, int total, int mustCompleted, int mustTotal) {
    return new DailyPlanResponse(
        plan.getId(), plan.getOwnerId(), plan.getPlanDate(), plan.getFirstSubmittedAt(), onTime,
        plan.getReviewReasons(), plan.getReviewWentWell(), plan.getReviewTomorrow(), tasks,
        completed, total, mustCompleted, mustTotal, plan.getCreatedAt(), plan.getUpdatedAt(),
        plan.getVersion());
  }

  default DailyWeekResponse toWeek(
      LocalDate start, DailyWeeklyReview review, int plannedDays, int weekDays, int nonemptyDays,
      BigDecimal completionRate, long mustCompleted, long mustTotal, BigDecimal mustRate,
      long onTimeDays) {
    return new DailyWeekResponse(
        review == null ? null : review.getId(), start,
        review == null ? null : review.getRecurringUnfinished(),
        review == null ? null : review.getIssues(),
        review == null ? null : review.getReflection(),
        review == null ? null : review.getNextWeekChanges(),
        plannedDays, weekDays, nonemptyDays, completionRate, mustCompleted, mustTotal, mustRate,
        onTimeDays, review == null ? null : review.getVersion());
  }
}
