package me.nghlong3004.olympic.daily;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.daily.enums.DailyTaskPriority;
import me.nghlong3004.olympic.daily.enums.DailyTaskStatus;
import me.nghlong3004.olympic.daily.request.DailyTaskRequest;
import me.nghlong3004.olympic.daily.request.SaveDailyPlanRequest;
import me.nghlong3004.olympic.daily.request.SaveDailyWeekRequest;
import me.nghlong3004.olympic.daily.response.DailyPlanResponse;
import me.nghlong3004.olympic.daily.service.impl.DailyServiceImpl;
import me.nghlong3004.olympic.daily.mapper.DailyMapperImpl;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@DataJpaTest(properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true"}, showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({DailyServiceImpl.class, DailyMapperImpl.class, DailyIntegrationTest.Dependencies.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers(disabledWithoutDocker = true)
@TestPropertySource(properties = "spring.jpa.open-in-view=false")
class DailyIntegrationTest {
  @Container @ServiceConnection
  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");
  private static final UUID OWNER = UUID.fromString("00000000-0000-0000-0000-00000000d101");
  private static final UUID OTHER = UUID.fromString("00000000-0000-0000-0000-00000000d102");
  private static final UUID ADMIN = UUID.fromString("00000000-0000-0000-0000-00000000d103");
  private static final LocalDate MONDAY = LocalDate.of(2026, 10, 5);
  private static final Instant MONDAY_MIDNIGHT = Instant.parse("2026-10-04T17:00:00Z");
  private static final Instant MONDAY_CUTOFF = Instant.parse("2026-10-05T00:30:00Z");
  @Autowired private DailyServiceImpl service;
  @Autowired private JdbcTemplate jdbc;
  @Autowired private MutableClock clock;
  @Autowired private TestUsers users;

  @BeforeEach
  void reset() {
    clock.set(MONDAY_MIDNIGHT);
    users.id.set(OWNER);
    jdbc.update("DELETE FROM daily_tasks");
    jdbc.update("DELETE FROM daily_weekly_reviews");
    jdbc.update("DELETE FROM daily_plans");
    jdbc.update("DELETE FROM users WHERE id IN (?,?,?)", OWNER, OTHER, ADMIN);
    insert(OWNER, "STUDENT");
    insert(OTHER, "STUDENT");
    insert(ADMIN, "ADMIN");
  }

  @Test
  void ownerSavesReopensAndKeepsTheFirstMidnightTimestamp() {
    var created = service.savePlan(MONDAY, plan(null, task(null, "Read", DailyTaskPriority.MUST, DailyTaskStatus.TODO),
        task(null, "Notes", DailyTaskPriority.SHOULD, DailyTaskStatus.TODO)));
    assertThat(created.ownerId()).isEqualTo(OWNER);
    assertThat(created.planDate()).isEqualTo(MONDAY);
    assertThat(created.firstSubmittedAt()).isNull();
    assertThat(created.onTime()).isFalse();
    assertThat(created.version()).isZero();
    var taskId = created.tasks().getFirst().id();

    assertThatThrownBy(() -> service.getPlan(MONDAY.plusDays(1)))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);

    var submitted = service.submitPlan(created.id());
    assertThat(submitted.firstSubmittedAt().toInstant()).isEqualTo(MONDAY_MIDNIGHT);
    assertThat(submitted.onTime()).isTrue();
    assertThat(submitted.version()).isEqualTo(1);

    clock.set(Instant.parse("2026-10-05T01:00:00Z"));
    var repeated = service.submitPlan(created.id());
    assertThat(repeated.firstSubmittedAt()).isEqualTo(submitted.firstSubmittedAt());
    assertThat(repeated.version()).isEqualTo(1);

    var edited = service.savePlan(MONDAY, new SaveDailyPlanRequest(repeated.version(), " reason ", "kept the hard task", "start earlier",
        List.of(task(taskId, "Read chapter", DailyTaskPriority.MUST, DailyTaskStatus.COMPLETED),
            task(created.tasks().get(1).id(), "Notes", DailyTaskPriority.SHOULD, DailyTaskStatus.TODO))));
    assertThat(edited.tasks()).extracting(item -> item.id()).containsExactly(taskId, created.tasks().get(1).id());
    assertThat(edited.tasks().getFirst().status()).isEqualTo(DailyTaskStatus.COMPLETED);
    assertThat(edited.completedCount()).isEqualTo(1);
    assertThat(edited.mustCompleted()).isEqualTo(1);
    assertThat(edited.reviewReasons()).isEqualTo("reason");
    assertThat(edited.firstSubmittedAt()).isEqualTo(submitted.firstSubmittedAt());
    assertThat(edited.planDate()).isEqualTo(MONDAY);
    assertThat(edited.ownerId()).isEqualTo(OWNER);

    var reopened = service.getPlan(MONDAY);
    assertThat(reopened.id()).isEqualTo(created.id());
    assertThat(reopened.firstSubmittedAt()).isEqualTo(submitted.firstSubmittedAt());
    assertThat(reopened.tasks()).extracting(item -> item.id()).containsExactly(taskId, created.tasks().get(1).id());
    assertThat(jdbc.queryForObject("select count(*) from daily_plans where owner_id = ? and plan_date = ?", Integer.class, OWNER, Date.valueOf(MONDAY))).isEqualTo(1);

    users.id.set(ADMIN);
    assertThatThrownBy(() -> service.submitPlan(created.id()))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.ACCESS_DENIED);
    users.id.set(OTHER);
    assertThatThrownBy(() -> service.getPlan(MONDAY))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);
  }

  @Test
  void sameMondayCutoffIsInclusiveAndOneMicrosecondLaterIsLate() {
    clock.set(MONDAY_CUTOFF);
    var onTime = service.submitPlan(service.savePlan(MONDAY, plan(null, task(null, "Cutoff", DailyTaskPriority.MUST, DailyTaskStatus.TODO))).id());
    assertThat(onTime.planDate()).isEqualTo(MONDAY);
    assertThat(onTime.onTime()).isTrue();
    assertThat(onTime.firstSubmittedAt().toInstant()).isEqualTo(MONDAY_CUTOFF);

    users.id.set(OTHER);
    clock.set(MONDAY_CUTOFF.plus(1, ChronoUnit.MICROS));
    var late = service.submitPlan(service.savePlan(MONDAY, plan(null, task(null, "After", DailyTaskPriority.COULD, DailyTaskStatus.TODO))).id());
    assertThat(late.planDate()).isEqualTo(MONDAY);
    assertThat(late.onTime()).isFalse();
    assertThat(late.firstSubmittedAt().toInstant()).isEqualTo(MONDAY_CUTOFF.plus(1, ChronoUnit.MICROS));
    assertThat(service.getPlan(MONDAY).id()).isEqualTo(late.id());
  }

  @Test
  void identicalClockBumpsPlanAndWeekOnceAndRejectsTheOldVersion() {
    var created = service.savePlan(MONDAY, plan(null, task(null, "Read", DailyTaskPriority.MUST, DailyTaskStatus.TODO)));
    var taskId = created.tasks().getFirst().id();
    var taskOnly = service.savePlan(MONDAY, plan(created.version(), task(taskId, "Read more", DailyTaskPriority.MUST, DailyTaskStatus.TODO)));
    assertThat(taskOnly.version()).isEqualTo(created.version() + 1);
    assertThat(taskOnly.updatedAt()).isAfter(created.updatedAt());
    assertThat(taskOnly.tasks().getFirst().id()).isEqualTo(taskId);

    var unchanged = service.savePlan(MONDAY, plan(taskOnly.version(), task(taskId, "Read more", DailyTaskPriority.MUST, DailyTaskStatus.TODO)));
    assertThat(unchanged.version()).isEqualTo(taskOnly.version() + 1);
    assertThat(unchanged.updatedAt()).isAfter(taskOnly.updatedAt());
    assertThatThrownBy(() -> service.savePlan(MONDAY, plan(taskOnly.version(), task(taskId, "Read more", DailyTaskPriority.MUST, DailyTaskStatus.TODO))))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.RESOURCE_STATE_CONFLICT);

    var week = service.saveWeek(MONDAY, new SaveDailyWeekRequest(null, "Lab", null, null, null));
    var before = jdbc.queryForObject("select updated_at from daily_weekly_reviews where id = ?", Timestamp.class, week.id());
    var weekAgain = service.saveWeek(MONDAY, new SaveDailyWeekRequest(week.version(), "Lab", null, null, null));
    var after = jdbc.queryForObject("select updated_at from daily_weekly_reviews where id = ?", Timestamp.class, weekAgain.id());
    assertThat(weekAgain.version()).isEqualTo(week.version() + 1);
    assertThat(after.toInstant()).isAfter(before.toInstant());
    assertThatThrownBy(() -> service.saveWeek(MONDAY, new SaveDailyWeekRequest(week.version(), "Lab", null, null, null)))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.RESOURCE_STATE_CONFLICT);
  }

  @Test
  void oneDateIsUniqueAndStaleOrForeignTasksConflict() {
    var first = service.savePlan(MONDAY, plan(null, task(null, "Mine", DailyTaskPriority.MUST, DailyTaskStatus.TODO)));
    assertThatThrownBy(() -> service.savePlan(MONDAY, plan(99L, task(first.tasks().getFirst().id(), "Mine", DailyTaskPriority.MUST, DailyTaskStatus.TODO))))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.RESOURCE_STATE_CONFLICT);

    users.id.set(OTHER);
    var other = service.savePlan(MONDAY, plan(null, task(null, "Theirs", DailyTaskPriority.SHOULD, DailyTaskStatus.TODO)));
    assertThat(other.id()).isNotEqualTo(first.id());
    assertThatThrownBy(() -> service.savePlan(MONDAY.plusDays(3),
        plan(null, task(first.tasks().getFirst().id(), "Borrowed", DailyTaskPriority.MUST, DailyTaskStatus.TODO))))
        .isInstanceOf(ApiException.class)
        .hasMessage("Task does not belong to this plan")
        .extracting("errorCode")
        .isEqualTo(ErrorCode.RESOURCE_STATE_CONFLICT);

    assertThatThrownBy(() -> jdbc.update(
        "INSERT INTO daily_plans(id, owner_id, plan_date, created_at, updated_at, version) VALUES (?,?,?,?,?,0)",
        UUID.randomUUID(), OWNER, Date.valueOf(MONDAY), Timestamp.from(Instant.now()), Timestamp.from(Instant.now())))
        .isInstanceOf(DataIntegrityViolationException.class);
    assertThat(jdbc.queryForList("select column_name from information_schema.columns where table_name = 'daily_plans' and column_name = 'group_id'")).isEmpty();
    assertThat(jdbc.queryForObject("select count(*) from daily_plans where plan_date = ?", Integer.class, Date.valueOf(MONDAY))).isEqualTo(2);
  }

  @Test
  void concurrentFirstSubmitKeepsOneTimestampAndVersion() throws Exception {
    var created = service.savePlan(LocalDate.of(2026, 10, 8), plan(null, task(null, "Once", DailyTaskPriority.MUST, DailyTaskStatus.TODO)));
    clock.stepFrom(Instant.parse("2026-10-08T02:00:00Z"));
    var results = new CopyOnWriteArrayList<DailyPlanResponse>();
    var errors = new CopyOnWriteArrayList<Throwable>();
    var start = new CountDownLatch(1);
    var done = new CountDownLatch(2);
    try (var pool = Executors.newFixedThreadPool(2)) {
      for (var ignored = 0; ignored < 2; ignored++) {
        pool.submit(() -> {
          try {
            start.await();
            results.add(service.submitPlan(created.id()));
          } catch (Throwable error) {
            errors.add(error);
          } finally {
            done.countDown();
          }
        });
      }
      start.countDown();
      assertThat(done.await(20, TimeUnit.SECONDS)).isTrue();
    }
    assertThat(errors).isEmpty();
    assertThat(results).hasSize(2);
    assertThat(results.getFirst().firstSubmittedAt()).isEqualTo(results.get(1).firstSubmittedAt());
    assertThat(results).allMatch(item -> item.version() == 1);
    assertThat(jdbc.queryForObject("select count(distinct first_submitted_at) from daily_plans where id = ?", Integer.class, created.id())).isEqualTo(1);
  }

  @Test
  void concurrentCreateOfTheSameDateLeavesOnePlan() throws Exception {
    var date = LocalDate.of(2026, 10, 9);
    var ids = new CopyOnWriteArrayList<UUID>();
    var errors = new CopyOnWriteArrayList<Throwable>();
    var start = new CountDownLatch(1);
    var done = new CountDownLatch(2);
    try (var pool = Executors.newFixedThreadPool(2)) {
      for (var ignored = 0; ignored < 2; ignored++) {
        pool.submit(() -> {
          try {
            start.await();
            ids.add(service.savePlan(date, plan(null, task(null, "Race", DailyTaskPriority.COULD, DailyTaskStatus.TODO))).id());
          } catch (Throwable error) {
            errors.add(error);
          } finally {
            done.countDown();
          }
        });
      }
      start.countDown();
      assertThat(done.await(20, TimeUnit.SECONDS)).isTrue();
    }
    assertThat(ids).hasSize(1);
    assertThat(errors).hasSize(1);
    assertThat(((ApiException) errors.getFirst()).getErrorCode().getStatus().value()).isEqualTo(409);
    assertThat(jdbc.queryForObject("select count(*) from daily_plans where owner_id = ? and plan_date = ?", Integer.class, OWNER, Date.valueOf(date))).isEqualTo(1);
  }

  @Test
  void weeklyMeanUsesUnequalDayRatesAndZeroMustIsNotApplicable() {
    clock.set(MONDAY_MIDNIGHT);
    service.submitPlan(service.savePlan(MONDAY, plan(null,
        task(null, "Must", DailyTaskPriority.MUST, DailyTaskStatus.COMPLETED),
        task(null, "Should", DailyTaskPriority.SHOULD, DailyTaskStatus.TODO))).id());
    clock.set(Instant.parse("2026-10-06T00:30:01Z"));
    service.submitPlan(service.savePlan(MONDAY.plusDays(1), plan(null, task(null, "Could", DailyTaskPriority.COULD, DailyTaskStatus.COMPLETED))).id());
    service.savePlan(MONDAY.plusDays(2), plan(null));

    var week = service.getWeek(MONDAY.plusDays(3));
    assertThat(week.weekStart()).isEqualTo(MONDAY);
    assertThat(week.plannedDays()).isEqualTo(3);
    assertThat(week.weekDays()).isEqualTo(7);
    assertThat(week.nonemptyDays()).isEqualTo(2);
    assertThat(week.completionRate()).isEqualByComparingTo(new BigDecimal("0.75"));
    assertThat(week.completionRate()).isNotEqualByComparingTo(new BigDecimal("0.6667"));
    assertThat(week.mustCompleted()).isEqualTo(1);
    assertThat(week.mustTotal()).isEqualTo(1);
    assertThat(week.mustRate()).isEqualByComparingTo(BigDecimal.ONE);
    assertThat(week.onTimeDays()).isEqualTo(1);
    assertThat(week.version()).isNull();

    var saved = service.saveWeek(MONDAY, new SaveDailyWeekRequest(null, " Lab ", "late start", "prepare Sunday", "block the morning"));
    assertThat(saved.id()).isNotNull();
    assertThat(saved.recurringUnfinished()).isEqualTo("Lab");
    assertThat(saved.version()).isZero();
    var reopened = service.getWeek(MONDAY);
    assertThat(reopened.id()).isEqualTo(saved.id());
    assertThat(reopened.reflection()).isEqualTo("prepare Sunday");
    assertThatThrownBy(() -> service.saveWeek(MONDAY, new SaveDailyWeekRequest(4L, "Lab", null, null, null)))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.RESOURCE_STATE_CONFLICT);

    var emptyMust = service.savePlan(MONDAY.plusDays(7), plan(null, task(null, "Only should", DailyTaskPriority.SHOULD, DailyTaskStatus.COMPLETED)));
    var second = service.getWeek(emptyMust.planDate());
    assertThat(second.mustTotal()).isZero();
    assertThat(second.mustRate()).isNull();
    assertThat(second.completionRate()).isEqualByComparingTo(BigDecimal.ONE);
    assertThat(second.plannedDays()).isEqualTo(1);

    users.id.set(OTHER);
    var hidden = service.getWeek(MONDAY);
    assertThat(hidden.plannedDays()).isZero();
    assertThat(hidden.completionRate()).isNull();
    assertThat(hidden.mustRate()).isNull();
    assertThat(hidden.recurringUnfinished()).isNull();
  }

  private SaveDailyPlanRequest plan(Long version, DailyTaskRequest... tasks) {
    return new SaveDailyPlanRequest(version, null, null, null, List.of(tasks));
  }

  private DailyTaskRequest task(UUID id, String title, DailyTaskPriority priority, DailyTaskStatus status) {
    return new DailyTaskRequest(id, title, priority, status);
  }

  private void insert(UUID id, String role) {
    jdbc.update("INSERT INTO users(id, email, username, full_name, role, status) VALUES (?,?,?,?,?::user_role,'ACTIVE')",
        id, id + "@test.invalid", id.toString(), "Daily user", role);
  }

  @TestConfiguration
  static class Dependencies {
    @Bean MutableClock clock() { return new MutableClock(); }
    @Bean TestUsers testUsers() { return new TestUsers(); }
  }

  static final class TestUsers implements CurrentUserProvider {
    final ThreadLocal<UUID> id = ThreadLocal.withInitial(() -> OWNER);
    @Override public CurrentUser getCurrentUser() {
      var userId = id.get();
      var role = userId.equals(ADMIN) ? Role.ADMIN : Role.STUDENT;
      return new CurrentUser(userId, userId + "@test.invalid", userId.toString(), "Daily user", role, Status.ACTIVE, List.of());
    }
  }

  static final class MutableClock extends Clock {
    private volatile Instant now = MONDAY_MIDNIGHT;
    private volatile boolean step;
    private final AtomicLong steps = new AtomicLong();
    void set(Instant instant) { now = instant; step = false; steps.set(0); }
    void stepFrom(Instant instant) { now = instant; step = true; steps.set(0); }
    @Override public ZoneId getZone() { return ZoneOffset.UTC; }
    @Override public Clock withZone(ZoneId zone) { return this; }
    @Override public Instant instant() { return step ? now.plusMillis(steps.getAndIncrement()) : now; }
  }
}
