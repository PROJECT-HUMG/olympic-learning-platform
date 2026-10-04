package me.nghlong3004.olympic.daily.evidence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.daily.enums.DailyTaskPriority;
import me.nghlong3004.olympic.daily.enums.DailyTaskStatus;
import me.nghlong3004.olympic.daily.evidence.enums.EvidenceStage;
import me.nghlong3004.olympic.daily.evidence.request.CreateEvidenceLinkRequest;
import me.nghlong3004.olympic.daily.evidence.response.EvidenceMetadataResponse;
import me.nghlong3004.olympic.daily.evidence.service.EvidenceService;
import me.nghlong3004.olympic.daily.evidence.service.impl.EvidenceServiceImpl;
import me.nghlong3004.olympic.daily.request.DailyTaskRequest;
import me.nghlong3004.olympic.daily.request.SaveDailyPlanRequest;
import me.nghlong3004.olympic.daily.response.DailyPlanResponse;
import me.nghlong3004.olympic.daily.service.DailyService;
import me.nghlong3004.olympic.daily.service.impl.DailyServiceImpl;
import me.nghlong3004.olympic.daily.mapper.DailyMapperImpl;
import me.nghlong3004.olympic.daily.evidence.mapper.EvidenceMapperImpl;
import me.nghlong3004.olympic.group.enums.MembershipStatus;
import me.nghlong3004.olympic.group.enums.SharingMode;
import me.nghlong3004.olympic.group.service.GroupMembershipService;
import me.nghlong3004.olympic.group.service.impl.GroupDailyAccessImpl;
import me.nghlong3004.olympic.group.service.impl.GroupMembershipServiceImpl;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.exception.UserDisabledException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Disposable PostgreSQL proof. Internal group fixture seeding is not HTTP invitation proof.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@DataJpaTest(properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true",
    "spring.jpa.open-in-view=false"}, showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({EvidenceServiceImpl.class, DailyServiceImpl.class, GroupDailyAccessImpl.class,
    GroupMembershipServiceImpl.class, DailyMapperImpl.class, EvidenceMapperImpl.class,
    EvidenceIntegrationTest.Dependencies.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers(disabledWithoutDocker = true)
class EvidenceIntegrationTest {
  @Container @ServiceConnection
  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");
  private static final UUID OWNER = UUID.fromString("00000000-0000-0000-0000-00000000e201");
  private static final UUID VIEWER = UUID.fromString("00000000-0000-0000-0000-00000000e202");
  private static final UUID ADMIN = UUID.fromString("00000000-0000-0000-0000-00000000e203");
  private static final LocalDate DATE = LocalDate.of(2026, 10, 5);
  private static final byte[] BYTES = new byte[]{1, 2, 3, 4};
  @Autowired private EvidenceService evidence;
  @Autowired private DailyService daily;
  @Autowired private GroupMembershipService groups;
  @Autowired private JdbcTemplate jdbc;
  @Autowired private Actors actors;
  private UUID planId;
  private UUID taskId;
  private UUID groupId;

  @BeforeEach
  void reset() {
    actors.id.set(OWNER);
    jdbc.update("DELETE FROM daily_evidence");
    jdbc.update("DELETE FROM daily_tasks");
    jdbc.update("DELETE FROM daily_plans");
    jdbc.update("DELETE FROM accountability_group_share_viewers");
    jdbc.update("DELETE FROM accountability_group_memberships");
    jdbc.update("DELETE FROM accountability_groups");
    jdbc.update("DELETE FROM users WHERE id IN (?,?,?)", OWNER, VIEWER, ADMIN);
    for (var id : List.of(OWNER, VIEWER, ADMIN)) {
      jdbc.update("INSERT INTO users(id,email,username,full_name,role,status) VALUES (?,?,?,?,?::user_role,'ACTIVE')",
          id, id + "@test.invalid", id.toString(), "Evidence user", id.equals(ADMIN) ? "ADMIN" : "STUDENT");
    }
    var plan = newPlan(DATE);
    planId = plan.id();
    taskId = plan.tasks().getFirst().id();
    groupId = groups.createGroup(OWNER, "Evidence fixture").getId();
    groups.recordAcceptedMember(groupId, VIEWER);
    groups.recordAcceptedMember(groupId, ADMIN);
  }

  @Test
  void createsMultipleSameStageFilesAndLinkThenReopensOriginalBytesWithoutPlanMutation() {
    var before = daily.submitPlan(planId);
    var first = file();
    var second = file();
    var link = evidence.createLink(planId, taskId, new CreateEvidenceLinkRequest(
        EvidenceStage.START, "https://example.org/work", " Work notes "));
    assertThat(first.id()).isNotEqualTo(second.id());
    assertThat(first.originalName()).isEqualTo("notes.svg");
    assertThat(first.url()).isNull();
    assertThat(first.label()).isNull();
    assertThat(link.sizeBytes()).isNull();
    assertThat(link.originalName()).isNull();
    assertThat(link.label()).isEqualTo("Work notes");
    assertThat(evidence.list(planId, taskId, null)).hasSize(3);
    assertThat(evidence.download(planId, taskId, first.id(), null).content()).containsExactly(BYTES);
    assertThat(daily.getPlan(DATE)).isEqualTo(before);
    evidence.remove(planId, taskId, second.id());
    assertThat(evidence.list(planId, taskId, null)).hasSize(2);
    assertThat(daily.getPlan(DATE)).isEqualTo(before);
    expect(ErrorCode.RESOURCE_NOT_FOUND, () -> evidence.download(planId, taskId, link.id(), null));
  }

  @Test
  void taskRemovalCascadesEvidenceBytes() {
    var item = file();
    var plan = daily.getPlan(DATE);
    daily.savePlan(DATE, new SaveDailyPlanRequest(plan.version(), null, null, null, List.of()));
    assertThat(jdbc.queryForObject("SELECT count(*) FROM daily_evidence WHERE id = ?", Long.class, item.id())).isZero();
    expect(ErrorCode.RESOURCE_NOT_FOUND, () -> evidence.download(planId, taskId, item.id(), null));
  }

  @Test
  void currentGroupOffDeselectionAndEitherMembershipLossRevokeOldMetadataAndBytes() {
    var item = file();
    actors.id.set(VIEWER);
    denyBoth(item);
    groups.updateOwnShare(groupId, OWNER, true, SharingMode.GROUP);
    assertThat(evidence.list(planId, taskId, groupId)).hasSize(1);
    assertThat(evidence.download(planId, taskId, item.id(), groupId).content()).containsExactly(BYTES);
    groups.updateOwnShare(groupId, OWNER, false, SharingMode.GROUP);
    denyBoth(item);
    groups.updateOwnShare(groupId, OWNER, true, SharingMode.SELECTED_MEMBERS);
    denyBoth(item);
    groups.setSelectedViewer(groupId, OWNER, VIEWER, true);
    assertThat(evidence.list(planId, taskId, groupId)).hasSize(1);
    groups.setSelectedViewer(groupId, OWNER, VIEWER, false);
    denyBoth(item);
    groups.updateOwnShare(groupId, OWNER, true, SharingMode.GROUP);
    groups.changeOwnStatus(groupId, VIEWER, MembershipStatus.INACTIVE);
    denyBoth(item);
    groups.changeOwnStatus(groupId, VIEWER, MembershipStatus.ACTIVE);
    groups.changeOwnStatus(groupId, OWNER, MembershipStatus.INACTIVE);
    denyBoth(item);
  }

  @Test
  void activeAccountChecksRejectDisabledDeletedOwnerAndViewerDespiteActiveClaims() {
    var item = file();
    groups.updateOwnShare(groupId, OWNER, true, SharingMode.GROUP);
    actors.id.set(VIEWER);
    jdbc.update("UPDATE users SET status='DISABLED' WHERE id=?", OWNER);
    denyBoth(item);
    jdbc.update("UPDATE users SET status='ACTIVE', deleted_at=now() WHERE id=?", OWNER);
    denyBoth(item);
    jdbc.update("UPDATE users SET deleted_at=NULL WHERE id=?", OWNER);
    jdbc.update("UPDATE users SET status='DISABLED' WHERE id=?", VIEWER);
    assertThatThrownBy(() -> evidence.list(planId, taskId, groupId)).isInstanceOf(UserDisabledException.class);
    jdbc.update("UPDATE users SET status='ACTIVE', deleted_at=now() WHERE id=?", VIEWER);
    expect(ErrorCode.USER_NOT_FOUND, () -> evidence.list(planId, taskId, groupId));
  }

  @Test
  void nestedMismatchAdminAndUnrelatedGroupCannotBypassPermission() {
    var item = file();
    var other = newPlan(DATE.plusDays(1));
    expect(ErrorCode.RESOURCE_NOT_FOUND, () -> evidence.list(other.id(), taskId, null));
    expect(ErrorCode.RESOURCE_NOT_FOUND, () -> evidence.download(other.id(), other.tasks().getFirst().id(), item.id(), null));
    var foreignGroup = groups.createGroup(VIEWER, "Unrelated").getId();
    expect(ErrorCode.ACCESS_DENIED, () -> evidence.list(planId, taskId, foreignGroup));
    actors.id.set(ADMIN);
    expect(ErrorCode.ACCESS_DENIED, () -> evidence.list(planId, taskId, null));
    denyBoth(item);
    expect(ErrorCode.ACCESS_DENIED, this::file);
    expect(ErrorCode.ACCESS_DENIED, () -> evidence.remove(planId, taskId, item.id()));
    // The founder of an unrelated group has no implicit right to this owner's evidence.
    actors.id.set(VIEWER);
    expect(ErrorCode.ACCESS_DENIED, () -> evidence.list(planId, taskId, foreignGroup));
  }

  @Test
  void validationRejectsEmptyOversizedAndUnsafeLinksWithoutPersistence() {
    expect(ErrorCode.VALIDATION_ERROR, () -> evidence.createFile(planId, taskId, EvidenceStage.START,
        new MockMultipartFile("file", "empty", "text/plain", new byte[0])));
    expect(ErrorCode.VALIDATION_ERROR, () -> evidence.createFile(planId, taskId, EvidenceStage.START,
        new MockMultipartFile("file", "large", "text/plain", new byte[5 * 1024 * 1024 + 1])));
    for (var url : List.of("javascript:alert(1)", "data:text/html,x", "https://name:secret@example.org/work", "/relative", "https://example.org/a b")) {
      expect(ErrorCode.VALIDATION_ERROR, () -> evidence.createLink(planId, taskId,
          new CreateEvidenceLinkRequest(EvidenceStage.FINISH, url, "notes")));
    }
    expect(ErrorCode.VALIDATION_ERROR, () -> evidence.createLink(planId, taskId,
        new CreateEvidenceLinkRequest(null, "https://example.org/", "notes")));
    expect(ErrorCode.VALIDATION_ERROR, () -> evidence.createLink(planId, taskId,
        new CreateEvidenceLinkRequest(EvidenceStage.START, "https://example.org/", " ")));
    assertThat(evidence.list(planId, taskId, null)).isEmpty();
  }

  @Test
  void concurrentCreatesSerializeAtTenWithoutChangingPlanVersion() throws Exception {
    for (int index = 0; index < 9; index++) file();
    var before = daily.getPlan(DATE);
    var ready = new CountDownLatch(2);
    var start = new CountDownLatch(1);
    var failures = new CopyOnWriteArrayList<Throwable>();
    try (var pool = Executors.newFixedThreadPool(2)) {
      for (int index = 0; index < 2; index++) pool.submit(() -> {
        actors.id.set(OWNER);
        ready.countDown();
        try { start.await(); file(); } catch (Throwable failure) { failures.add(failure); }
      });
      assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
      start.countDown();
      pool.shutdown();
      assertThat(pool.awaitTermination(30, TimeUnit.SECONDS)).isTrue();
    }
    assertThat(failures).hasSize(1);
    assertThat(failures.getFirst()).isInstanceOf(ApiException.class);
    assertThat(((ApiException) failures.getFirst()).getErrorCode()).isEqualTo(ErrorCode.RESOURCE_STATE_CONFLICT);
    assertThat(evidence.list(planId, taskId, null)).hasSize(10);
    assertThat(daily.getPlan(DATE)).isEqualTo(before);
  }

  private DailyPlanResponse newPlan(LocalDate date) {
    return daily.savePlan(date, new SaveDailyPlanRequest(null, null, null, null,
        List.of(new DailyTaskRequest(null, "Work", DailyTaskPriority.MUST, DailyTaskStatus.TODO))));
  }
  private EvidenceMetadataResponse file() {
    return evidence.createFile(planId, taskId, EvidenceStage.START,
        new MockMultipartFile("file", "../notes.svg", "image/svg+xml", BYTES));
  }
  private void denyBoth(EvidenceMetadataResponse item) {
    expect(ErrorCode.ACCESS_DENIED, () -> evidence.list(planId, taskId, groupId));
    expect(ErrorCode.ACCESS_DENIED, () -> evidence.download(planId, taskId, item.id(), groupId));
  }
  private static void expect(ErrorCode code, Runnable action) {
    assertThatThrownBy(action::run).isInstanceOf(ApiException.class).extracting("errorCode").isEqualTo(code);
  }

  @TestConfiguration
  static class Dependencies {
    @Bean Clock clock() { return Clock.fixed(Instant.parse("2026-10-05T00:00:00Z"), ZoneOffset.UTC); }
    @Bean Actors actors() { return new Actors(); }
  }
  static class Actors implements CurrentUserProvider {
    final ThreadLocal<UUID> id = ThreadLocal.withInitial(() -> OWNER);
    @Override public CurrentUser getCurrentUser() {
      return new CurrentUser(id.get(), "fixture@test.invalid", "fixture", "Fixture",
          id.get().equals(ADMIN) ? Role.ADMIN : Role.STUDENT, Status.ACTIVE, List.of());
    }
  }
}
