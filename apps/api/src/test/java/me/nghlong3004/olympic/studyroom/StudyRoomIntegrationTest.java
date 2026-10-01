package me.nghlong3004.olympic.studyroom;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomRequestPolicy;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomTrackStatus;
import me.nghlong3004.olympic.studyroom.request.AdvanceStudyRoomPlaybackRequest;
import me.nghlong3004.olympic.studyroom.request.CreateStudyRoomRequest;
import me.nghlong3004.olympic.studyroom.request.RequestStudyRoomTrackRequest;
import me.nghlong3004.olympic.studyroom.request.UpdateStudyRoomSettingsRequest;
import me.nghlong3004.olympic.studyroom.service.StudyRoomService;
import me.nghlong3004.olympic.studyroom.service.impl.StudyRoomServiceImpl;
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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/1/2026
 */
@DataJpaTest(properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true", "logging.level.org.hibernate.SQL=OFF", "logging.level.org.hibernate.orm.jdbc.bind=OFF"}, showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({StudyRoomServiceImpl.class, StudyRoomIntegrationTest.Dependencies.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers(disabledWithoutDocker = true)
class StudyRoomIntegrationTest {
  @Container @ServiceConnection
  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");
  private static final UUID HOST = UUID.fromString("00000000-0000-0000-0000-000000002001");
  private static final UUID MEMBER = UUID.fromString("00000000-0000-0000-0000-000000002002");
  @Autowired private StudyRoomService service;
  @Autowired private JdbcTemplate jdbc;
  @Autowired private MutableClock clock;
  @Autowired private TestUser users;
  private UUID id;

  @BeforeEach
  void setUp() {
    jdbc.update("DELETE FROM study_rooms");
    jdbc.update("DELETE FROM users WHERE id IN (?, ?)", HOST, MEMBER);
    for (UUID user : new UUID[] {HOST, MEMBER}) jdbc.update(
        "INSERT INTO users(id,email,username,full_name,role,status) VALUES (?,?,?,?,'STUDENT','ACTIVE')",
        user, user + "@test.invalid", user.toString(), user.equals(HOST) ? "Chủ phòng" : "Thành viên");
    clock.now = Instant.parse("2026-10-01T00:00:00Z");
    users.id.set(HOST);
    id = service.create(input()).id();
  }

  private CreateStudyRoomRequest input() {
    return new CreateStudyRoomRequest("Cùng học", 25, 5, 15, StudyRoomRequestPolicy.AFTER_FOCUS, 1);
  }

  private RequestStudyRoomTrackRequest track() {
    return new RequestStudyRoomTrackRequest("https://youtu.be/5qap5aO4i9A", "Nhạc học bài");
  }

  private void memberJoins() { users.id.set(MEMBER); service.join(id); }

  @Test
  void accruesServerFocusOnlyAndNeverDuplicatesOrCreditsStaleGaps() {
    memberJoins();
    clock.now = clock.now.plusSeconds(10);
    assertThat(service.heartbeat(id).me().focusSeconds()).isEqualTo(10);
    assertThat(service.heartbeat(id).me().focusSeconds()).isEqualTo(10);
    clock.now = clock.now.plusSeconds(40);
    assertThat(service.heartbeat(id).me().focusSeconds()).isEqualTo(10);
    clock.now = clock.now.plusSeconds(5);
    assertThat(service.heartbeat(id).me().focusSeconds()).isEqualTo(15);
    clock.now = Instant.parse("2026-10-01T00:24:55Z");
    service.join(id);
    clock.now = clock.now.plusSeconds(10);
    assertThat(service.heartbeat(id).me().focusSeconds()).isEqualTo(20);
    clock.now = clock.now.plusSeconds(10);
    assertThat(service.heartbeat(id).me().focusSeconds()).isEqualTo(20);
  }

  @Test
  void thresholdPolicyAndOwnerModerationAreEnforcedInService() {
    memberJoins();
    assertThatThrownBy(() -> service.requestTrack(id, track())).isInstanceOf(ApiException.class);
    for (int i = 0; i < 3; i++) { clock.now = clock.now.plusSeconds(20); service.heartbeat(id); }
    var pending = service.requestTrack(id, track());
    assertThat(pending.tracks().getFirst().status()).isEqualTo(StudyRoomTrackStatus.PENDING);
    assertThatThrownBy(() -> service.requestTrack(id, track())).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.approve(id, pending.tracks().getFirst().id())).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.settings(id, new UpdateStudyRoomSettingsRequest(StudyRoomRequestPolicy.OPEN, 0))).isInstanceOf(ApiException.class);
    users.id.set(HOST);
    assertThat(service.approve(id, pending.tracks().getFirst().id()).playback().isDefault()).isTrue();
    assertThat(service.next(id, new AdvanceStudyRoomPlaybackRequest(0L)).playback().videoId()).isEqualTo("5qap5aO4i9A");
    assertThatThrownBy(() -> service.next(id, new AdvanceStudyRoomPlaybackRequest(0L)))
        .isInstanceOf(ApiException.class).matches(e -> ((ApiException)e).getErrorCode() == ErrorCode.STUDY_ROOM_CONFLICT);
    assertThat(service.next(id, new AdvanceStudyRoomPlaybackRequest(1L)).playback().isDefault()).isTrue();
  }

  @Test
  void switchingRoomsRevokesOldMembershipWithoutLosingEarnedTime() {
    var other = service.create(input()).id();
    memberJoins();
    clock.now = clock.now.plusSeconds(20); service.heartbeat(id);
    service.join(other);
    assertThat(service.get(id).me()).isNull();
    assertThatThrownBy(() -> service.heartbeat(id)).isInstanceOf(ApiException.class);
    service.join(id);
    assertThat(service.get(id).me().focusSeconds()).isEqualTo(20);
    assertThat(jdbc.queryForObject("SELECT count(*) FROM study_room_members WHERE user_id=? AND joined", Long.class, MEMBER)).isEqualTo(1);
  }

  @Test
  void expiredLeasesRequireExplicitRejoinAndLeaveIsIdempotent() {
    memberJoins();
    clock.now = clock.now.plusSeconds(121);
    assertThat(service.get(id).me()).isNull();
    assertThatThrownBy(() -> service.heartbeat(id)).isInstanceOf(ApiException.class);
    assertThat(service.join(id).me().focusSeconds()).isZero();
    service.leave(id); service.leave(id);
    assertThat(service.get(id).me()).isNull();
  }

  @Test
  void closeStopsCreditsAndAllMutationsAndAllowsSnapshotRecovery() {
    memberJoins();
    assertThatThrownBy(() -> service.close(id)).isInstanceOf(ApiException.class);
    users.id.set(HOST); service.close(id);
    users.id.set(MEMBER);
    assertThat(service.get(id).closed()).isTrue();
    assertThat(service.get(id).me()).isNull();
    assertThatThrownBy(() -> service.join(id)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.requestTrack(id, track())).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.heartbeat(id)).isInstanceOf(ApiException.class);
  }

  @Test
  void concurrentHeartbeatsAndTrackAdvancesSerializeOnDatabaseLocks() throws Exception {
    memberJoins(); clock.now = clock.now.plusSeconds(10);
    try (var pool = Executors.newFixedThreadPool(2)) {
      Callable<Long> beat = () -> { users.id.set(MEMBER); return service.heartbeat(id).me().focusSeconds(); };
      var a = pool.submit(beat); var b = pool.submit(beat);
      assertThat(a.get(10, TimeUnit.SECONDS)).isEqualTo(10);
      assertThat(b.get(10, TimeUnit.SECONDS)).isEqualTo(10);
      users.id.set(HOST); service.requestTrack(id, track());
      Callable<Boolean> advance = () -> {
        users.id.set(HOST);
        try { service.next(id, new AdvanceStudyRoomPlaybackRequest(0L)); return true; }
        catch (ApiException e) { assertThat(e.getErrorCode()).isEqualTo(ErrorCode.STUDY_ROOM_CONFLICT); return false; }
      };
      var first = pool.submit(advance); var second = pool.submit(advance);
      assertThat(first.get(10, TimeUnit.SECONDS) ^ second.get(10, TimeUnit.SECONDS)).isTrue();
      assertThat(service.get(id).playback().version()).isEqualTo(1);
    }
  }

  @Test
  void allMembershipMutationsRejectInactiveUsers() {
    jdbc.update("UPDATE users SET status='DISABLED' WHERE id=?", MEMBER);
    users.id.set(MEMBER);
    assertThatThrownBy(() -> service.join(id)).isInstanceOf(RuntimeException.class);
    assertThat(jdbc.queryForObject("SELECT count(*) FROM study_room_members WHERE user_id=?", Long.class, MEMBER)).isZero();
  }

  @TestConfiguration
  static class Dependencies {
    @Bean MutableClock roomClock() { return new MutableClock(); }
    @Bean TestUser testUser() { return new TestUser(); }
  }

  static class TestUser implements CurrentUserProvider {
    final ThreadLocal<UUID> id = new ThreadLocal<>();
    @Override public CurrentUser getCurrentUser() { return CurrentUser.builder().id(id.get()).build(); }
  }

  static class MutableClock extends Clock {
    volatile Instant now;
    @Override public ZoneId getZone() { return ZoneOffset.UTC; }
    @Override public Clock withZone(ZoneId zone) { return this; }
    @Override public Instant instant() { return now; }
  }
}
