package me.nghlong3004.olympic.daily.sharing.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.daily.entity.DailyPlan;
import me.nghlong3004.olympic.daily.entity.DailyTask;
import me.nghlong3004.olympic.daily.enums.DailyTaskPriority;
import me.nghlong3004.olympic.daily.enums.DailyTaskStatus;
import me.nghlong3004.olympic.daily.mapper.DailyMapper;
import me.nghlong3004.olympic.daily.repository.DailyPlanRepository;
import me.nghlong3004.olympic.daily.repository.DailyWeeklyReviewRepository;
import me.nghlong3004.olympic.daily.response.DailyPlanResponse;
import me.nghlong3004.olympic.daily.response.DailyWeekResponse;
import me.nghlong3004.olympic.daily.service.DailyCalendar;
import me.nghlong3004.olympic.daily.sharing.enums.DailyShareAccess;
import me.nghlong3004.olympic.daily.sharing.mapper.SharedDailyMapper;
import me.nghlong3004.olympic.daily.sharing.response.*;
import me.nghlong3004.olympic.daily.sharing.service.SharedDailyAccess;
import me.nghlong3004.olympic.daily.sharing.service.SharedDailyService;
import me.nghlong3004.olympic.group.enums.MembershipStatus;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupMembershipRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Service
@RequiredArgsConstructor
public class SharedDailyServiceImpl implements SharedDailyService {
  private final SharedDailyAccess access;
  private final AccountabilityGroupMembershipRepository members;
  private final DailyPlanRepository plans;
  private final DailyWeeklyReviewRepository weeks;
  private final DailyMapper mapper;
  private final SharedDailyMapper sharingMapper;

  @Transactional(readOnly = true)
  @Override
  public SharedDailyDashboardResponse dashboard(UUID groupId, LocalDate date) {
    var actor = access.requireDashboardViewer(groupId);
    requireDate(date);
    var rows =
        members.findByGroup_IdAndStatus(groupId, MembershipStatus.ACTIVE).stream()
            .filter(m -> m.getUser().getDeletedAt() == null && m.getUser().active())
            .map(
                m -> {
                  var user = m.getUser();
                  var visible = access.visibleTo(groupId, user.getId(), actor.getId());
                  // Do not read private plan existence/counts for a NOT_SHARED row.
                  var plan =
                      visible
                          ? plans
                              .findByOwnerIdAndPlanDate(user.getId(), date)
                              .map(this::project)
                              .orElse(null)
                          : null;
                  var summary = plan == null ? null : sharingMapper.toSummary(plan);
                  return sharingMapper.toMember(
                      user, visible ? DailyShareAccess.SHARED : DailyShareAccess.NOT_SHARED, summary);
                })
            .sorted(Comparator.comparing(SharedDailyMemberResponse::displayName))
            .toList();
    return sharingMapper.toDashboard(groupId, date, rows);
  }

  @Transactional(readOnly = true)
  @Override
  public DailyPlanResponse readPlan(UUID groupId, UUID ownerId, LocalDate date) {
    access.requireSharedReader(groupId, ownerId);
    return plans
        .findByOwnerIdAndPlanDate(ownerId, requireDate(date))
        .map(this::project)
        .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
  }

  @Transactional(readOnly = true)
  @Override
  public DailyWeekResponse readWeek(UUID groupId, UUID ownerId, LocalDate date) {
    access.requireSharedReader(groupId, ownerId);
    var start = DailyCalendar.weekStart(requireDate(date));
    var review = weeks.findByOwnerIdAndWeekStart(ownerId, start).orElse(null);
    var unique = new LinkedHashMap<UUID, DailyPlan>();
    for (var plan : plans.findOwnedBetween(ownerId, start, start.plusDays(7)))
      unique.putIfAbsent(plan.getId(), plan);
    var rows = unique.values();
    var nonempty = rows.stream().filter(p -> !p.getTasks().isEmpty()).toList();
    BigDecimal completion = null;
    if (!nonempty.isEmpty()) {
      var sum = BigDecimal.ZERO;
      for (var plan : nonempty) {
        var done =
            plan.getTasks().stream()
                .filter(t -> t.getStatus() == DailyTaskStatus.COMPLETED)
                .count();
        sum =
            sum.add(
                BigDecimal.valueOf(done)
                    .divide(BigDecimal.valueOf(plan.getTasks().size()), 8, RoundingMode.HALF_UP));
      }
      completion = sum.divide(BigDecimal.valueOf(nonempty.size()), 4, RoundingMode.HALF_UP);
    }
    long mustTotal = 0, mustDone = 0;
    for (var plan : rows)
      for (var task : plan.getTasks()) {
        if (task.getPriority() == DailyTaskPriority.MUST) {
          mustTotal++;
          if (task.getStatus() == DailyTaskStatus.COMPLETED) mustDone++;
        }
      }
    var mustRate =
        mustTotal == 0
            ? null
            : BigDecimal.valueOf(mustDone)
                .divide(BigDecimal.valueOf(mustTotal), 4, RoundingMode.HALF_UP);
    var onTime =
        rows.stream()
            .filter(p -> DailyCalendar.onTime(p.getPlanDate(), p.getFirstSubmittedAt()))
            .count();
    return mapper.toWeek(
        start, review, rows.size(), 7, nonempty.size(), completion, mustDone, mustTotal,
        mustRate, onTime);
  }

  private DailyPlanResponse project(DailyPlan plan) {
    var tasks =
        plan.getTasks().stream()
            .sorted(Comparator.comparingInt(DailyTask::getPosition))
            .map(mapper::toTask)
            .toList();
    var completed =
        (int)
            plan.getTasks().stream()
                .filter(t -> t.getStatus() == DailyTaskStatus.COMPLETED)
                .count();
    var mustTotal =
        (int)
            plan.getTasks().stream().filter(t -> t.getPriority() == DailyTaskPriority.MUST).count();
    var mustDone =
        (int)
            plan.getTasks().stream()
                .filter(
                    t ->
                        t.getPriority() == DailyTaskPriority.MUST
                            && t.getStatus() == DailyTaskStatus.COMPLETED)
                .count();
    return mapper.toPlan(
        plan, tasks, DailyCalendar.onTime(plan.getPlanDate(), plan.getFirstSubmittedAt()),
        completed, tasks.size(), mustDone, mustTotal);
  }

  private LocalDate requireDate(LocalDate date) {
    if (date == null) throw ErrorCode.VALIDATION_ERROR.throwIt("Date is required");
    return date;
  }
}
