package me.nghlong3004.olympic.daily.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.daily.entity.DailyPlan;
import me.nghlong3004.olympic.daily.entity.DailyTask;
import me.nghlong3004.olympic.daily.entity.DailyWeeklyReview;
import me.nghlong3004.olympic.daily.enums.DailyTaskPriority;
import me.nghlong3004.olympic.daily.enums.DailyTaskStatus;
import me.nghlong3004.olympic.daily.mapper.DailyMapper;
import me.nghlong3004.olympic.daily.repository.DailyPlanRepository;
import me.nghlong3004.olympic.daily.repository.DailyWeeklyReviewRepository;
import me.nghlong3004.olympic.daily.request.DailyTaskRequest;
import me.nghlong3004.olympic.daily.request.SaveDailyPlanRequest;
import me.nghlong3004.olympic.daily.request.SaveDailyWeekRequest;
import me.nghlong3004.olympic.daily.response.DailyPlanResponse;
import me.nghlong3004.olympic.daily.response.DailyWeekResponse;
import me.nghlong3004.olympic.daily.service.DailyCalendar;
import me.nghlong3004.olympic.daily.service.DailyService;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DailyServiceImpl implements DailyService {
  private static final int MAX_TASKS = 50;
  private static final int MAX_TEXT = 4000;
  private final CurrentUserProvider currentUserProvider;
  private final UserRepository users;
  private final DailyPlanRepository plans;
  private final DailyWeeklyReviewRepository weeks;
  private final DailyMapper mapper;
  private final Clock clock;

  @Override
  @Transactional(readOnly = true)
  public DailyPlanResponse getPlan(LocalDate date) {
    var owner = actor();
    return plans
        .findByOwnerIdAndPlanDate(owner.getId(), requireDate(date))
        .map(this::planResponse)
        .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
  }

  @Override
  @Transactional
  public DailyPlanResponse savePlan(LocalDate date, SaveDailyPlanRequest request) {
    var owner = actor();
    var planDate = requireDate(date);
    var existing = plans.findForUpdateByOwnerIdAndPlanDate(owner.getId(), planDate);
    if (existing.isEmpty()) {
      if (request.expectedVersion() != null)
        throw ErrorCode.VALIDATION_ERROR.throwIt("A new plan has no version");
      var plan = new DailyPlan();
      plan.setId(UUID.randomUUID());
      plan.setOwnerId(owner.getId());
      plan.setPlanDate(planDate);
      var stamp = now();
      plan.setCreatedAt(stamp);
      plan.setUpdatedAt(stamp);
      plan.setTasks(new ArrayList<>());
      applyReview(plan, request);
      replaceTasks(plan, request.tasks());
      try {
        plans.saveAndFlush(plan);
      } catch (DataIntegrityViolationException exception) {
        throw duplicate(
            exception, "uk_daily_plan_owner_date", "A plan for this date already exists");
      }
      log.info("Daily plan saved: planId={} date={}", plan.getId(), plan.getPlanDate());
      return planResponse(plan);
    }
    var plan = existing.get();
    if (request.expectedVersion() == null || !request.expectedVersion().equals(plan.getVersion())) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt("Reload the plan before saving");
    }
    applyReview(plan, request);
    replaceTasks(plan, request.tasks());
    plan.setUpdatedAt(monotonic(plan.getUpdatedAt(), now()));
    plans.saveAndFlush(plan);
    log.info("Daily plan saved: planId={} date={}", plan.getId(), plan.getPlanDate());
    return planResponse(plan);
  }

  @Override
  @Transactional
  public DailyPlanResponse submitPlan(UUID planId) {
    var owner = actor();
    var plan = plans.findForUpdateById(planId).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (!owner.getId().equals(plan.getOwnerId())) throw ErrorCode.ACCESS_DENIED.throwIt();
    if (plan.getFirstSubmittedAt() == null) {
      var stamp = now();
      plan.setFirstSubmittedAt(stamp);
      plan.setUpdatedAt(monotonic(plan.getUpdatedAt(), stamp));
      plans.saveAndFlush(plan);
      log.info("Daily plan submitted: planId={} date={}", plan.getId(), plan.getPlanDate());
    }
    return planResponse(plan);
  }

  @Override
  @Transactional(readOnly = true)
  public DailyWeekResponse getWeek(LocalDate date) {
    var owner = actor();
    var start = DailyCalendar.weekStart(requireDate(date));
    var review = weeks.findByOwnerIdAndWeekStart(owner.getId(), start).orElse(null);
    return weekResponse(owner.getId(), start, review);
  }

  @Override
  @Transactional
  public DailyWeekResponse saveWeek(LocalDate date, SaveDailyWeekRequest request) {
    var owner = actor();
    var start = DailyCalendar.weekStart(requireDate(date));
    var existing = weeks.findForUpdateByOwnerIdAndWeekStart(owner.getId(), start);
    DailyWeeklyReview review;
    if (existing.isEmpty()) {
      if (request.expectedVersion() != null)
        throw ErrorCode.VALIDATION_ERROR.throwIt("A new week has no version");
      review = new DailyWeeklyReview();
      review.setId(UUID.randomUUID());
      review.setOwnerId(owner.getId());
      review.setWeekStart(start);
      var stamp = now();
      review.setCreatedAt(stamp);
      review.setUpdatedAt(stamp);
      applyWeek(review, request);
      try {
        weeks.saveAndFlush(review);
      } catch (DataIntegrityViolationException exception) {
        throw duplicate(exception, "uk_daily_week_owner", "A review for this week already exists");
      }
    } else {
      review = existing.get();
      if (request.expectedVersion() == null
          || !request.expectedVersion().equals(review.getVersion())) {
        throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt("Reload the week before saving");
      }
      applyWeek(review, request);
      review.setUpdatedAt(monotonic(review.getUpdatedAt(), now()));
      weeks.saveAndFlush(review);
    }
    log.info("Daily week saved: reviewId={} weekStart={}", review.getId(), review.getWeekStart());
    return weekResponse(owner.getId(), start, review);
  }

  private void applyReview(DailyPlan plan, SaveDailyPlanRequest request) {
    plan.setReviewReasons(clean(request.reviewReasons()));
    plan.setReviewWentWell(clean(request.reviewWentWell()));
    plan.setReviewTomorrow(clean(request.reviewTomorrow()));
  }

  private void applyWeek(DailyWeeklyReview review, SaveDailyWeekRequest request) {
    review.setRecurringUnfinished(clean(request.recurringUnfinished()));
    review.setIssues(clean(request.issues()));
    review.setReflection(clean(request.reflection()));
    review.setNextWeekChanges(clean(request.nextWeekChanges()));
  }

  private void replaceTasks(DailyPlan plan, List<DailyTaskRequest> requests) {
    if (requests == null) throw ErrorCode.VALIDATION_ERROR.throwIt("Tasks are required");
    if (requests.size() > MAX_TASKS)
      throw ErrorCode.VALIDATION_ERROR.throwIt("A plan has at most 50 tasks");
    var current = new LinkedHashMap<UUID, DailyTask>();
    for (var task : plan.getTasks()) current.put(task.getId(), task);
    var ordered = new ArrayList<DailyTask>();
    var seen = new HashSet<UUID>();
    for (var request : requests) {
      if (request == null
          || request.priority() == null
          || request.status() == null
          || !StringUtils.hasText(request.title())) {
        throw ErrorCode.VALIDATION_ERROR.throwIt("Each task needs a title, priority, and status");
      }
      var title = request.title().trim();
      if (title.length() > 200)
        throw ErrorCode.VALIDATION_ERROR.throwIt("Task title is at most 200 characters");
      DailyTask task;
      if (request.id() == null) {
        task = new DailyTask();
        task.setId(UUID.randomUUID());
        task.setPlan(plan);
      } else {
        if (!seen.add(request.id()))
          throw ErrorCode.VALIDATION_ERROR.throwIt("Task id is repeated");
        task = current.get(request.id());
        if (task == null)
          throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt("Task does not belong to this plan");
      }
      task.setTitle(title);
      task.setPriority(request.priority());
      task.setStatus(request.status());
      ordered.add(task);
    }
    plan.getTasks()
        .removeIf(task -> ordered.stream().noneMatch(item -> item.getId().equals(task.getId())));
    for (var task : ordered) {
      if (!plan.getTasks().contains(task)) plan.getTasks().add(task);
    }
    for (var index = 0; index < ordered.size(); index++) ordered.get(index).setPosition(index);
  }

  private DailyPlanResponse planResponse(DailyPlan plan) {
    var tasks =
        plan.getTasks().stream()
            .sorted(Comparator.comparingInt(DailyTask::getPosition))
            .map(mapper::toTask)
            .toList();
    var completed =
        (int)
            plan.getTasks().stream()
                .filter(task -> task.getStatus() == DailyTaskStatus.COMPLETED)
                .count();
    var mustTotal =
        (int)
            plan.getTasks().stream()
                .filter(task -> task.getPriority() == DailyTaskPriority.MUST)
                .count();
    var mustCompleted =
        (int)
            plan.getTasks().stream()
                .filter(
                    task ->
                        task.getPriority() == DailyTaskPriority.MUST
                            && task.getStatus() == DailyTaskStatus.COMPLETED)
                .count();
    return mapper.toPlan(
        plan, tasks, DailyCalendar.onTime(plan.getPlanDate(), plan.getFirstSubmittedAt()),
        completed, tasks.size(), mustCompleted, mustTotal);
  }

  private DailyWeekResponse weekResponse(UUID ownerId, LocalDate start, DailyWeeklyReview review) {
    var unique = new LinkedHashMap<UUID, DailyPlan>();
    for (var plan : plans.findOwnedBetween(ownerId, start, start.plusDays(7)))
      unique.putIfAbsent(plan.getId(), plan);
    var rows = unique.values();
    var nonempty = rows.stream().filter(plan -> !plan.getTasks().isEmpty()).toList();
    BigDecimal completionRate = null;
    if (!nonempty.isEmpty()) {
      var sum = BigDecimal.ZERO;
      for (var plan : nonempty) {
        var total = plan.getTasks().size();
        var done =
            plan.getTasks().stream()
                .filter(task -> task.getStatus() == DailyTaskStatus.COMPLETED)
                .count();
        sum =
            sum.add(
                BigDecimal.valueOf(done)
                    .divide(BigDecimal.valueOf(total), 8, RoundingMode.HALF_UP));
      }
      completionRate = sum.divide(BigDecimal.valueOf(nonempty.size()), 4, RoundingMode.HALF_UP);
    }
    long mustTotal = 0;
    long mustCompleted = 0;
    for (var plan : rows) {
      for (var task : plan.getTasks()) {
        if (task.getPriority() != DailyTaskPriority.MUST) continue;
        mustTotal++;
        if (task.getStatus() == DailyTaskStatus.COMPLETED) mustCompleted++;
      }
    }
    var mustRate =
        mustTotal == 0
            ? null
            : BigDecimal.valueOf(mustCompleted)
                .divide(BigDecimal.valueOf(mustTotal), 4, RoundingMode.HALF_UP);
    var onTimeDays =
        rows.stream()
            .filter(plan -> DailyCalendar.onTime(plan.getPlanDate(), plan.getFirstSubmittedAt()))
            .count();
    return mapper.toWeek(
        start, review, rows.size(), 7, nonempty.size(), completionRate, mustCompleted, mustTotal,
        mustRate, onTimeDays);
  }

  private User actor() {
    var current = currentUserProvider.getCurrentUser();
    var user =
        users
            .findByIdAndDeletedAtIsNull(current.id())
            .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);
    user.requireActiveForAuth();
    return user;
  }

  private LocalDate requireDate(LocalDate date) {
    if (date == null) throw ErrorCode.VALIDATION_ERROR.throwIt("Date is required");
    return date;
  }

  private String clean(String value) {
    if (!StringUtils.hasText(value)) return null;
    var trimmed = value.trim();
    if (trimmed.length() > MAX_TEXT)
      throw ErrorCode.VALIDATION_ERROR.throwIt("Reflection text is at most 4000 characters");
    return trimmed;
  }

  private OffsetDateTime now() {
    return OffsetDateTime.ofInstant(clock.instant(), ZoneOffset.UTC).truncatedTo(ChronoUnit.MICROS);
  }

  private OffsetDateTime monotonic(OffsetDateTime current, OffsetDateTime stamp) {
    if (current != null && !stamp.isAfter(current)) return current.plus(1, ChronoUnit.MICROS);
    return stamp;
  }

  private RuntimeException duplicate(
      DataIntegrityViolationException exception, String constraint, String detail) {
    var message = exception.getMostSpecificCause().getMessage();
    if (message != null && message.contains(constraint))
      return ErrorCode.DUPLICATE_RESOURCE.throwIt(detail);
    return exception;
  }
}
