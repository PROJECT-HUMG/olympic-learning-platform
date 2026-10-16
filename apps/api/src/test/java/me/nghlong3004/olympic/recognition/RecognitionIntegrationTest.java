package me.nghlong3004.olympic.recognition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.RecordComponent;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.properties.UserProperties;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.recognition.enums.AchievementAward;
import me.nghlong3004.olympic.recognition.enums.AchievementCategory;
import me.nghlong3004.olympic.recognition.enums.AchievementStatus;
import me.nghlong3004.olympic.recognition.enums.HonorScope;
import me.nghlong3004.olympic.recognition.enums.HonorStatus;
import me.nghlong3004.olympic.recognition.mapper.RecognitionMapperImpl;
import me.nghlong3004.olympic.recognition.request.HonorParticipantRequest;
import me.nghlong3004.olympic.recognition.request.ReviewAchievementRequest;
import me.nghlong3004.olympic.recognition.request.SaveHonorRequest;
import me.nghlong3004.olympic.recognition.request.SubmitAchievementRequest;
import me.nghlong3004.olympic.recognition.response.AchievementResponse;
import me.nghlong3004.olympic.recognition.response.PublicAchievementResponse;
import me.nghlong3004.olympic.recognition.service.RecognitionService;
import me.nghlong3004.olympic.recognition.service.RecognitionUploadPolicy;
import me.nghlong3004.olympic.recognition.service.impl.RecognitionServiceImpl;
import me.nghlong3004.olympic.storage.mapper.FileMapper;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.exception.UserDisabledException;
import me.nghlong3004.olympic.user.mapper.UserMapper;
import me.nghlong3004.olympic.user.service.impl.UserServiceImpl;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
@DataJpaTest(
    properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true"},
    showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({
  UserServiceImpl.class,
  RecognitionServiceImpl.class,
  RecognitionUploadPolicy.class,
  RecognitionMapperImpl.class,
  RecognitionIntegrationTest.Dependencies.class
})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@EnabledIf("databaseAvailable")
class RecognitionIntegrationTest {
  static PostgreSQLContainer postgres;
  static DriverManagerDataSource localAdmin;
  static String localSchema;

  static boolean databaseAvailable() {
    return System.getProperty("recognitionTest.jdbcUrl") != null
        || DockerClientFactory.instance().isDockerAvailable();
  }

  @DynamicPropertySource
  static void database(DynamicPropertyRegistry registry) {
    var url = System.getProperty("recognitionTest.jdbcUrl");
    String user;
    String password;
    if (url == null) {
      postgres = new PostgreSQLContainer("postgres:16-alpine");
      postgres.start();
      url = postgres.getJdbcUrl();
      user = postgres.getUsername();
      password = postgres.getPassword();
    } else {
      if (!url.startsWith("jdbc:postgresql://127.0.0.1:"))
        throw new IllegalArgumentException("Disposable loopback PostgreSQL only");
      user = System.getProperty("recognitionTest.user", "postgres");
      password = "";
      localAdmin = new DriverManagerDataSource(url, user, password);
      localSchema = "recognition_test_" + UUID.randomUUID().toString().replace("-", "");
      new JdbcTemplate(localAdmin).execute("CREATE SCHEMA " + localSchema);
      url += (url.contains("?") ? "&" : "?") + "currentSchema=" + localSchema;
    }
    var finalUrl = url;
    var finalUser = user;
    var finalPassword = password;
    registry.add("spring.datasource.url", () -> finalUrl);
    registry.add("spring.datasource.username", () -> finalUser);
    registry.add("spring.datasource.password", () -> finalPassword);
    registry.add(
        "spring.flyway.default-schema", () -> localSchema == null ? "public" : localSchema);
  }

  @AfterAll
  static void closeDatabase() {
    if (localAdmin != null && localSchema != null)
      new JdbcTemplate(localAdmin).execute("DROP SCHEMA " + localSchema + " CASCADE");
    if (postgres != null) postgres.stop();
  }

  private static final UUID OWNER = UUID.fromString("00000000-0000-0000-0000-000000009001");
  private static final UUID OTHER = UUID.fromString("00000000-0000-0000-0000-000000009002");
  private static final UUID THIRD = UUID.fromString("00000000-0000-0000-0000-000000009003");
  private static final UUID ADMIN = UUID.fromString("00000000-0000-0000-0000-000000009004");
  private static final UUID LECTURER = UUID.fromString("00000000-0000-0000-0000-000000009005");
  private static final LocalDate DATE = LocalDate.of(2026, 9, 1);
  private static final byte[] PNG =
      Base64.getDecoder()
          .decode(
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1sAAAAASUVORK5CYII=");
  @Autowired private RecognitionService service;
  @MockitoBean private UserMapper userMapper;
  @MockitoBean private UserProperties userProperties;
  @MockitoBean private StorageService storageService;
  @MockitoBean private FileMapper fileMapper;
  @Autowired private JdbcTemplate jdbc;
  @Autowired private TestUsers users;
  @Autowired private PlatformTransactionManager transactionManager;

  @BeforeEach
  void resetDatabaseAndStudents() {
    jdbc.update("DELETE FROM recognition_score_events");
    jdbc.update("DELETE FROM recognition_files");
    jdbc.update("DELETE FROM recognition_honors");
    jdbc.update("DELETE FROM recognition_achievements");
    jdbc.update("DELETE FROM recognition_preferences");
    jdbc.update("DELETE FROM users WHERE id IN (?,?,?,?,?)", OWNER, OTHER, THIRD, ADMIN, LECTURER);
    for (UUID id : List.of(OWNER, OTHER, THIRD, ADMIN, LECTURER)) {
      String role = id.equals(ADMIN) ? "ADMIN" : id.equals(LECTURER) ? "LECTURER" : "STUDENT";
      jdbc.update(
          "INSERT INTO users(id,email,username,full_name,role,status) VALUES"
              + " (?,?,?,?,?::user_role,'ACTIVE')",
          id,
          id + "@test.invalid",
          id.toString(),
          "User " + id.toString().substring(32),
          role);
    }
    users.id.set(OWNER);
  }

  @Test
  void onlyApprovedRecordsScoreAndApprovalIsIdempotentAndRevocable() {
    service.setPreferences(true);
    var pending = submit("National first", true, AchievementAward.FIRST, DATE);
    assertThat(score(OWNER, null)).isZero();
    assertThat(service.profile(OWNER).achievements()).isEmpty();
    var approved = approve(pending);
    assertThat(score(OWNER, null)).isEqualTo(16);
    var repeat =
        service.reviewAchievement(
            approved.id(),
            new ReviewAchievementRequest(AchievementStatus.APPROVED, null, approved.version()));
    assertThat(repeat.totalPoints()).isEqualTo(16);
    assertThat(score(OWNER, null)).isEqualTo(16);
    assertThat(service.rankings(null, 0, 20).getContent().getFirst().approvedCount()).isEqualTo(1);
    service.reviewAchievement(
        repeat.id(),
        new ReviewAchievementRequest(
            AchievementStatus.REVOKED, "Invalid evidence confirmed", repeat.version()));
    assertThat(score(OWNER, null)).isZero();
    assertThat(service.profile(OWNER).achievements()).isEmpty();
  }

  @Test
  void privacyChangesPublicDetailsWithoutChangingConfirmedRankingPoints() {
    service.setPreferences(true);
    var approved = approve(submit("Private award", false, AchievementAward.FIRST, DATE));
    assertThat(score(OWNER, null)).isEqualTo(16);
    assertThat(service.profile(OWNER).publicPoints()).isZero();
    assertThat(service.profile(OWNER).achievements()).isEmpty();
    users.id.set(OWNER);
    service.setVisibility(approved.id(), true);
    assertThat(score(OWNER, null)).isEqualTo(16);
    var profile = service.profile(OWNER);
    assertThat(profile.publicPoints()).isEqualTo(16);
    assertThat(profile.achievements()).hasSize(1);
    assertPublicProjection();

    service.setVisibility(approved.id(), false);
    assertThat(score(OWNER, null)).isEqualTo(16);
    assertThat(service.profile(OWNER).publicPoints()).isZero();
    users.id.set(OTHER);
    assertThatThrownBy(() -> service.setVisibility(approved.id(), true))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void rankingRequiresConsentAndFiltersLiveStudentEligibility() {
    assertThat(service.preferences().rankingOptIn()).isFalse();
    approve(submit("Opt-in first", true, AchievementAward.FIRST, DATE));
    assertThat(service.rankings(null, 0, 20).getContent()).isEmpty();
    users.id.set(OWNER);
    service.setPreferences(true);
    assertThat(score(OWNER, null)).isEqualTo(16);
    service.setPreferences(false);
    assertThat(service.rankings(null, 0, 20).getContent()).isEmpty();
    assertThat(service.listMyAchievements()).hasSize(1);
    service.setPreferences(true);
    jdbc.update("UPDATE users SET status='DISABLED' WHERE id=?", OWNER);
    assertThat(service.rankings(null, 0, 20).getContent()).isEmpty();
    assertThatThrownBy(service::listMyAchievements).isInstanceOf(UserDisabledException.class);
    jdbc.update("UPDATE users SET status='ACTIVE',role='LECTURER' WHERE id=?", OWNER);
    assertThat(service.rankings(null, 0, 20).getContent()).isEmpty();
    jdbc.update("UPDATE users SET role='STUDENT',deleted_at=now() WHERE id=?", OWNER);
    assertThat(service.rankings(null, 0, 20).getContent()).isEmpty();
  }

  @Test
  void yearUsesAchievementDateAndRanksStaySequentialAcrossPages() {
    for (UUID id : List.of(OWNER, OTHER, THIRD)) {
      users.id.set(id);
      service.setPreferences(true);
      approve(
          submit(
              "2026 " + id,
              true,
              id.equals(THIRD) ? AchievementAward.SECOND : AchievementAward.FIRST,
              DATE));
    }
    var yearly = service.rankings(2026, 0, 20).getContent();
    assertThat(yearly).extracting(row -> row.rank()).containsExactly(1L, 2L, 3L);
    assertThat(yearly).extracting(row -> row.userId()).containsExactly(OWNER, OTHER, THIRD);
    assertThat(service.rankings(2026, 1, 1).getContent().getFirst().rank()).isEqualTo(2);
    assertThat(service.rankings(2026, 2, 1).getContent().getFirst().rank()).isEqualTo(3);
    users.id.set(OWNER);
    approve(
        submit(
            "Older award approved now", true, AchievementAward.SECOND, LocalDate.of(2025, 9, 1)));
    assertThat(score(OWNER, null)).isEqualTo(31);
    assertThat(score(OWNER, 2026)).isEqualTo(16);
    assertThat(score(OWNER, 2025)).isEqualTo(15);
    assertThat(service.rankings(2024, 0, 20).getContent()).isEmpty();
  }

  @Test
  void reviewerMustBeALiveAdministratorAndStaleDecisionsCannotOverwrite() {
    var pending = submit("Review boundary", true, AchievementAward.FIRST, DATE);
    users.id.set(ADMIN);
    assertThat(service.adminListAchievements(null, null, 0, 20).getContent()).hasSize(1);
    assertThat(service.adminListAchievements(AchievementStatus.PENDING, OWNER, 0, 20).getContent())
        .hasSize(1);
    for (UUID id : List.of(OWNER, OTHER, LECTURER)) {
      users.id.set(id);
      assertThatThrownBy(
              () ->
                  service.reviewAchievement(
                      pending.id(),
                      new ReviewAchievementRequest(
                          AchievementStatus.APPROVED, null, pending.version())))
          .isInstanceOf(ApiException.class);
      assertThatThrownBy(() -> service.adminListAchievements(null, null, 0, 20))
          .isInstanceOf(ApiException.class);
    }
    var approved = approve(pending);
    assertThatThrownBy(
            () ->
                service.reviewAchievement(
                    approved.id(),
                    new ReviewAchievementRequest(
                        AchievementStatus.REVOKED, "Old screen", pending.version())))
        .isInstanceOf(ApiException.class)
        .matches(error -> ((ApiException) error).getErrorCode() == ErrorCode.RECOGNITION_CONFLICT);
    assertThatThrownBy(
            () ->
                service.reviewAchievement(
                    approved.id(),
                    new ReviewAchievementRequest(
                        AchievementStatus.REVOKED, " ", approved.version())))
        .isInstanceOf(ApiException.class);
    jdbc.update("UPDATE users SET role='STUDENT' WHERE id=?", ADMIN);
    assertThatThrownBy(
            () ->
                service.reviewAchievement(
                    approved.id(),
                    new ReviewAchievementRequest(
                        AchievementStatus.REVOKED, "Stale admin token", approved.version())))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void duplicateReviewRacesCannotCreditTwice() throws Exception {
    service.setPreferences(true);
    var pending = submit("Concurrent review", true, AchievementAward.FIRST, DATE);
    try (var pool = Executors.newFixedThreadPool(2)) {
      Callable<Boolean> task =
          () -> {
            users.id.set(ADMIN);
            try {
              service.reviewAchievement(
                  pending.id(),
                  new ReviewAchievementRequest(
                      AchievementStatus.APPROVED, null, pending.version()));
              return true;
            } catch (ApiException conflict) {
              assertThat(conflict.getErrorCode()).isEqualTo(ErrorCode.RECOGNITION_CONFLICT);
              return false;
            }
          };
      var first = pool.submit(task);
      var second = pool.submit(task);
      assertThat(List.of(first.get(20, TimeUnit.SECONDS), second.get(20, TimeUnit.SECONDS)))
          .contains(true);
    }
    assertThat(score(OWNER, null)).isEqualTo(16);
    assertThat(service.rankings(null, 0, 20).getContent().getFirst().approvedCount()).isEqualTo(1);
  }

  @Test
  void concurrentDuplicateSubmissionsLeaveOneClaimAndOnePrivateProof() throws Exception {
    try (var pool = Executors.newFixedThreadPool(2)) {
      Callable<Boolean> task =
          () -> {
            users.id.set(OWNER);
            try {
              submit("One academic event", false, AchievementAward.FIRST, DATE);
              return true;
            } catch (ApiException duplicate) {
              assertThat(duplicate.getErrorCode()).isEqualTo(ErrorCode.RECOGNITION_DUPLICATE);
              return false;
            }
          };
      var first = pool.submit(task);
      var second = pool.submit(task);
      assertThat(List.of(first.get(20, TimeUnit.SECONDS), second.get(20, TimeUnit.SECONDS)))
          .containsExactlyInAnyOrder(true, false);
    }
    assertThat(service.listMyAchievements()).hasSize(1);
    assertThat(jdbc.queryForObject("SELECT count(*) FROM recognition_files", Long.class))
        .isEqualTo(1);
  }

  @Test
  void evidenceIsOwnerOrAdminOnlyEvenForPublishedAchievement() {
    var pending = submit("Sensitive certificate", true, AchievementAward.FIRST, DATE);
    var file = pending.evidence().getFirst();
    assertThat(file.url()).isNull();
    assertThat(service.getEvidence(pending.id(), file.id()).content()).isEqualTo(PNG);
    users.id.set(OTHER);
    assertThatThrownBy(() -> service.getEvidence(pending.id(), file.id()))
        .isInstanceOf(ApiException.class);
    users.id.set(LECTURER);
    assertThatThrownBy(() -> service.getEvidence(pending.id(), file.id()))
        .isInstanceOf(ApiException.class);
    approve(pending);
    assertThat(service.getEvidence(pending.id(), file.id()).content()).isEqualTo(PNG);
    assertPublicProjection();
    users.id.set(OTHER);
    var other = submit("Other certificate", true, AchievementAward.FIRST, DATE);
    users.id.set(OWNER);
    assertThatThrownBy(() -> service.getEvidence(pending.id(), other.evidence().getFirst().id()))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void evidenceLimitsAndRealContentAreValidatedBeforeAnyRecordIsStored() {
    var input = claim(null, "Bad proof", true, AchievementAward.FIRST, DATE);
    assertThatThrownBy(() -> service.submitAchievement(input, List.of(), false))
        .isInstanceOf(ApiException.class);
    var fake =
        new MockMultipartFile(
            "evidence", "certificate.png", "image/png", "<svg onload='alert(1)'/>".getBytes());
    assertThatThrownBy(() -> service.submitAchievement(input, List.of(fake), false))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(
            () ->
                service.submitAchievement(
                    input, List.of(proof(), proof(), proof(), proof()), false))
        .isInstanceOf(ApiException.class);
    byte[] oversized = new byte[5 * 1024 * 1024 + 1];
    System.arraycopy(PNG, 0, oversized, 0, PNG.length);
    assertThatThrownBy(
            () ->
                service.submitAchievement(
                    input,
                    List.of(
                        new MockMultipartFile("evidence", "oversize.png", "image/png", oversized)),
                    false))
        .isInstanceOf(ApiException.class);
    assertThat(service.listMyAchievements()).isEmpty();
    var disguised = new MockMultipartFile("evidence", "certificate.html", "text/html", PNG);
    var accepted = service.submitAchievement(input, List.of(disguised), false);
    var stored = accepted.evidence().getFirst();
    assertThat(stored.originalName()).isEqualTo("certificate.html.png");
    assertThat(stored.contentType()).isEqualTo("image/png");
    assertThat(service.getEvidence(accepted.id(), stored.id()).content()).isEqualTo(PNG);
  }

  @Test
  void futureAchievementsCannotEnterTheReviewQueueEvenThroughDirectServiceCalls() {
    assertThatThrownBy(
            () ->
                service.submitAchievement(
                    claim(
                        null,
                        "Future result",
                        true,
                        AchievementAward.FIRST,
                        LocalDate.of(2026, 10, 3)),
                    List.of(proof()),
                    false))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(
            () ->
                service.submitAchievement(
                    claim(
                        null,
                        "Unsupported historical date",
                        true,
                        AchievementAward.FIRST,
                        LocalDate.of(1899, 12, 31)),
                    List.of(proof()),
                    false))
        .isInstanceOf(ApiException.class);
    assertThat(service.listMyAchievements()).isEmpty();
  }

  @Test
  void replacingProofAloneInvalidatesAnAlreadyOpenReview() {
    var original = submit("Same metadata new proof", false, AchievementAward.FIRST, DATE);
    var replaced =
        service.updateAchievement(
            original.id(),
            claim(null, "Same metadata new proof", false, AchievementAward.FIRST, DATE),
            List.of(proof()));
    assertThat(replaced.version()).isGreaterThan(original.version());
    assertThat(replaced.evidence().getFirst().id())
        .isNotEqualTo(original.evidence().getFirst().id());
    users.id.set(ADMIN);
    assertThatThrownBy(
            () ->
                service.reviewAchievement(
                    original.id(),
                    new ReviewAchievementRequest(
                        AchievementStatus.APPROVED, null, original.version())))
        .isInstanceOf(ApiException.class)
        .matches(error -> ((ApiException) error).getErrorCode() == ErrorCode.RECOGNITION_CONFLICT);
    assertThat(approve(replaced).status()).isEqualTo(AchievementStatus.APPROVED);
  }

  @Test
  void duplicateClaimsApprovedEditsAndSubmittingForOthersAreProtected() {
    var pending = submit("Repeated award", true, AchievementAward.FIRST, DATE);
    assertThatThrownBy(() -> submit("REPEATED AWARD", true, AchievementAward.SECOND, DATE))
        .isInstanceOf(ApiException.class);
    users.id.set(OTHER);
    assertThatThrownBy(
            () ->
                service.submitAchievement(
                    claim(OWNER, "Impersonation", true, AchievementAward.FIRST, DATE),
                    List.of(proof()),
                    false))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(
            () ->
                service.updateAchievement(
                    pending.id(),
                    claim(null, "Stolen record", true, AchievementAward.FIRST, DATE),
                    List.of(proof())))
        .isInstanceOf(ApiException.class);
    var approved = approve(pending);
    users.id.set(OWNER);
    assertThatThrownBy(
            () ->
                service.updateAchievement(
                    approved.id(),
                    claim(null, "Changed after approval", true, AchievementAward.SECOND, DATE),
                    List.of(proof())))
        .isInstanceOf(ApiException.class);
    users.id.set(ADMIN);
    var onBehalf =
        service.submitAchievement(
            claim(OTHER, "Admin entered award", true, AchievementAward.FIRST, DATE),
            List.of(proof()),
            true);
    assertThat(onBehalf.userId()).isEqualTo(OTHER);
    assertThat(onBehalf.status()).isEqualTo(AchievementStatus.PENDING);
  }

  @Test
  void rejectionRequiresReasonAndResubmissionRequiresFreshReview() {
    var pending = submit("Needs correction", true, AchievementAward.FIRST, DATE);
    users.id.set(ADMIN);
    assertThatThrownBy(
            () ->
                service.reviewAchievement(
                    pending.id(),
                    new ReviewAchievementRequest(
                        AchievementStatus.REJECTED, null, pending.version())))
        .isInstanceOf(ApiException.class);
    var rejected =
        service.reviewAchievement(
            pending.id(),
            new ReviewAchievementRequest(
                AchievementStatus.REJECTED, "Certificate missing details", pending.version()));
    assertThat(rejected.status()).isEqualTo(AchievementStatus.REJECTED);
    users.id.set(OWNER);
    var resubmitted =
        service.updateAchievement(
            rejected.id(),
            claim(null, "Corrected certificate", true, AchievementAward.SECOND, DATE),
            List.of(proof()));
    assertThat(resubmitted.status()).isEqualTo(AchievementStatus.PENDING);
    assertThat(service.profile(OWNER).achievements()).isEmpty();
  }

  @Test
  void rejectedHistoryRemainsOwnedButCannotBeResubmittedOverANewActiveClaim() {
    var first = submit("Same academic event", false, AchievementAward.FIRST, DATE);
    users.id.set(ADMIN);
    service.reviewAchievement(
        first.id(),
        new ReviewAchievementRequest(
            AchievementStatus.REJECTED, "Replace certificate", first.version()));
    users.id.set(OWNER);
    var replacement = submit("Same academic event", false, AchievementAward.SECOND, DATE);
    assertThatThrownBy(
            () ->
                service.updateAchievement(
                    first.id(),
                    claim(null, "Same academic event", false, AchievementAward.FIRST, DATE),
                    List.of(proof())))
        .isInstanceOf(ApiException.class);
    var own = service.listMyAchievements();
    assertThat(own).hasSize(2);
    assertThat(own)
        .extracting(AchievementResponse::status)
        .containsExactlyInAnyOrder(AchievementStatus.REJECTED, AchievementStatus.PENDING);
    approve(replacement);
    users.id.set(OWNER);
    assertThat(service.listMyAchievements())
        .extracting(AchievementResponse::status)
        .containsExactlyInAnyOrder(AchievementStatus.REJECTED, AchievementStatus.APPROVED);
    assertThat(service.listMyAchievements())
        .allSatisfy(row -> assertThat(row.evidence()).hasSize(1));
    assertThat(service.profile(OWNER).achievements()).isEmpty();
  }

  @Test
  void closedClaimsCannotExceedPendingCapacityWhilePendingCorrectionsRemainAllowed() {
    var pending = submit("Existing pending", false, AchievementAward.FIRST, DATE);
    var rejected = submit("Rejected before full queue", false, AchievementAward.FIRST, DATE);
    users.id.set(ADMIN);
    service.reviewAchievement(
        rejected.id(),
        new ReviewAchievementRequest(
            AchievementStatus.REJECTED, "Evidence incomplete", rejected.version()));
    users.id.set(OWNER);
    var revoked = approve(submit("Revoked before full queue", false, AchievementAward.FIRST, DATE));
    service.reviewAchievement(
        revoked.id(),
        new ReviewAchievementRequest(
            AchievementStatus.REVOKED, "Award withdrawn", revoked.version()));
    users.id.set(OWNER);
    jdbc.update(
        """
        INSERT INTO recognition_achievements
          (id,user_id,title,category,award,include_participation,achieved_date,
           public_visible,status,award_points,participation_points,submitted_by,created_at,updated_at)
        SELECT gen_random_uuid(),?,'Pending fixture ' || sequence,'OLYMPIC_NATIONAL','FIRST',false,
          DATE '2026-09-01',false,'PENDING',10,0,?,now(),now()
        FROM generate_series(1,49) AS sequence
        """,
        OWNER,
        OWNER);
    for (var closed : List.of(rejected, revoked)) {
      assertThatThrownBy(
              () ->
                  service.updateAchievement(
                      closed.id(),
                      claim(null, closed.title(), false, AchievementAward.FIRST, DATE),
                      List.of(proof())))
          .isInstanceOf(ApiException.class)
          .matches(
              error -> ((ApiException) error).getErrorCode() == ErrorCode.RECOGNITION_CONFLICT);
    }
    var history = service.listMyAchievements();
    var savedRejected =
        history.stream().filter(row -> row.id().equals(rejected.id())).findFirst().orElseThrow();
    var savedRevoked =
        history.stream().filter(row -> row.id().equals(revoked.id())).findFirst().orElseThrow();
    assertThat(savedRejected.status()).isEqualTo(AchievementStatus.REJECTED);
    assertThat(savedRevoked.status()).isEqualTo(AchievementStatus.REVOKED);
    assertThat(savedRejected.evidence().getFirst().id())
        .isEqualTo(rejected.evidence().getFirst().id());
    assertThat(savedRevoked.evidence().getFirst().id())
        .isEqualTo(revoked.evidence().getFirst().id());
    var corrected =
        service.updateAchievement(
            pending.id(),
            claim(null, pending.title(), false, AchievementAward.FIRST, DATE),
            List.of(proof()));
    assertThat(corrected.status()).isEqualTo(AchievementStatus.PENDING);
    assertThat(corrected.version()).isGreaterThan(pending.version());
    assertThat(
            jdbc.queryForObject(
                "SELECT count(*) FROM recognition_achievements WHERE status='PENDING'", Long.class))
        .isEqualTo(50);
  }

  @Test
  void draftHonorsAndPhotosRemainProtectedWhileManualAndAccountParticipantsKeepOrder() {
    users.id.set(ADMIN);
    var participants =
        List.of(
            new HonorParticipantRequest(OWNER, null, "First"),
            new HonorParticipantRequest(null, "Guest researcher", "Team member"));
    var draft =
        service.saveHonor(
            null,
            new SaveHonorRequest(
                "Academic memory",
                "Math",
                2026,
                "Team memories",
                HonorScope.NATIONAL,
                HonorStatus.DRAFT,
                participants,
                null));
    var gallery = service.addPhotos(draft.id(), List.of(proof()));
    assertThat(gallery.version()).isGreaterThan(draft.version());
    var photoId = gallery.photos().getFirst().id();
    assertThatThrownBy(() -> service.getHonor(draft.id(), false)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.getPhoto(draft.id(), photoId, false))
        .isInstanceOf(ApiException.class);
    assertThat(service.listHonors(null, null, 0, 20, false).getContent()).isEmpty();
    users.id.set(OTHER);
    assertThatThrownBy(() -> service.getHonor(draft.id(), true)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.deleteHonor(draft.id())).isInstanceOf(ApiException.class);
    users.id.set(ADMIN);
    var published =
        service.saveHonor(
            draft.id(),
            new SaveHonorRequest(
                "Academic memory",
                "Math",
                2026,
                "Team memories",
                HonorScope.NATIONAL,
                HonorStatus.PUBLISHED,
                participants,
                gallery.version()));
    assertThat(published.participants())
        .extracting(row -> row.userId())
        .containsExactly(OWNER, null);
    assertThat(published.participants().get(1).fullName()).isEqualTo("Guest researcher");
    assertThat(service.getHonor(draft.id(), false).status()).isEqualTo(HonorStatus.PUBLISHED);
    assertThat(service.listHonors(2026, "math", 0, 20, false).getContent()).hasSize(1);
    assertThat(service.listHonors(2025, null, 0, 20, false).getContent()).isEmpty();
    assertThat(service.listHonors(null, "Physics", 0, 20, false).getContent()).isEmpty();
    assertThat(service.getPhoto(draft.id(), photoId, false).content()).isEqualTo(PNG);
    assertThatThrownBy(
            () ->
                service.saveHonor(
                    draft.id(),
                    new SaveHonorRequest(
                        "Old editor",
                        "Math",
                        2026,
                        "Old contents",
                        HonorScope.NATIONAL,
                        HonorStatus.DRAFT,
                        participants,
                        gallery.version())))
        .isInstanceOf(ApiException.class)
        .matches(error -> ((ApiException) error).getErrorCode() == ErrorCode.RECOGNITION_CONFLICT);
    assertThat(service.profile(OWNER).publicPoints()).isZero();
    assertThat(jdbc.queryForObject("SELECT count(*) FROM recognition_achievements", Long.class))
        .isZero();
  }

  @Test
  void publicProfileIsActorIndependentAllActiveRolesAllowedAndDisabledDeletedPendingExcluded() {
    var approved = approve(submit("Public verified", true, AchievementAward.FIRST, DATE));
    users.id.set(OWNER);
    var privateRecord =
        approve(submit("Future owner private", false, AchievementAward.SECOND, DATE.minusDays(1)));
    users.id.set(OWNER);
    submit("Unconfirmed claim", true, AchievementAward.THIRD, DATE.minusDays(2));
    for (UUID reader : List.of(OWNER, OTHER, ADMIN)) {
      users.id.set(reader);
      var profile = service.profile(OWNER);
      assertThat(profile.achievements())
          .extracting(PublicAchievementResponse::id)
          .containsExactly(approved.id());
      assertThat(profile.publicPoints()).isEqualTo(approved.totalPoints());
      assertThat(profile.rankingOptIn()).isFalse();
      assertThat(profile.achievements())
          .extracting(PublicAchievementResponse::id)
          .doesNotContain(privateRecord.id());
    }
    assertThat(service.profile(LECTURER).achievements()).isEmpty();
    assertThat(service.profile(ADMIN).achievements()).isEmpty();
    for (String status : List.of("DISABLED", "PENDING")) {
      jdbc.update("UPDATE users SET status=?::user_status WHERE id=?", status, OWNER);
      assertThatThrownBy(() -> service.profile(OWNER)).isInstanceOf(ApiException.class);
    }
    jdbc.update("UPDATE users SET status='ACTIVE', deleted_at=CURRENT_TIMESTAMP WHERE id=?", OWNER);
    assertThatThrownBy(() -> service.profile(OWNER)).isInstanceOf(ApiException.class);
  }

  @Test
  void defaultVisibilityPreservesEligibilityConsentAndOwnerChoice() {
    var approved = approve(submit("Visible approved", true, AchievementAward.FIRST, DATE));
    users.id.set(OWNER);
    var pending = submit("Old private pending", false, AchievementAward.SECOND, DATE.minusDays(1));
    var rejectedClaim =
        submit("Old private rejected", false, AchievementAward.THIRD, DATE.minusDays(2));
    users.id.set(ADMIN);
    var rejected =
        service.reviewAchievement(
            rejectedClaim.id(),
            new ReviewAchievementRequest(
                AchievementStatus.REJECTED, "Internal review note", rejectedClaim.version()));
    users.id.set(OWNER);
    var revokedApproved =
        approve(submit("Old private revoked", false, AchievementAward.THIRD, DATE.minusDays(3)));
    var revoked =
        service.reviewAchievement(
            revokedApproved.id(),
            new ReviewAchievementRequest(
                AchievementStatus.REVOKED, "Internal revocation note", revokedApproved.version()));
    users.id.set(OWNER);
    assertThat(
            jdbc.queryForObject(
                "SELECT count(*) FROM recognition_achievements WHERE public_visible", Long.class))
        .isEqualTo(1);
    assertThat(
            jdbc.queryForObject(
                "SELECT version FROM recognition_achievements WHERE id=?",
                Long.class,
                approved.id()))
        .isEqualTo(approved.version());
    assertThat(
            jdbc.queryForObject(
                "SELECT status FROM recognition_achievements WHERE id=?",
                String.class,
                pending.id()))
        .isEqualTo("PENDING");
    assertThat(
            jdbc.queryForObject(
                "SELECT status FROM recognition_achievements WHERE id=?",
                String.class,
                rejected.id()))
        .isEqualTo("REJECTED");
    assertThat(
            jdbc.queryForObject(
                "SELECT status FROM recognition_achievements WHERE id=?",
                String.class,
                revoked.id()))
        .isEqualTo("REVOKED");
    assertThat(
            jdbc.queryForObject(
                "SELECT review_note FROM recognition_achievements WHERE id=?",
                String.class,
                rejected.id()))
        .isEqualTo("Internal review note");
    assertThat(jdbc.queryForObject("SELECT count(*) FROM recognition_preferences", Long.class))
        .isZero();
    assertThat(service.profile(OWNER).achievements())
        .extracting(PublicAchievementResponse::id)
        .containsExactly(approved.id());
    assertThat(service.profile(OWNER).publicPoints()).isEqualTo(approved.totalPoints());
    assertThat(service.rankings(null, 0, 20)).isEmpty();
    service.setVisibility(approved.id(), false);
    assertThat(service.profile(OWNER).achievements()).isEmpty();
    var defaults =
        new SubmitAchievementRequest(
            null,
            "New default public",
            "Test",
            AchievementCategory.OLYMPIC_NATIONAL,
            AchievementAward.FIRST,
            true,
            DATE.minusDays(4),
            null);
    assertThat(service.submitAchievement(defaults, List.of(proof()), false).publicVisible())
        .isTrue();
  }

  @Test
  void returningToAScoreUsesLatestAttainmentNotFirstApprovalOrVisibility() {
    users.id.set(OWNER);
    service.setPreferences(true);
    var original = approve(submit("First16", false, AchievementAward.FIRST, DATE));
    users.id.set(OWNER);
    var extra = approve(submit("Next16", false, AchievementAward.FIRST, DATE));
    users.id.set(OTHER);
    service.setPreferences(true);
    approve(submit("Other16", true, AchievementAward.FIRST, DATE));
    users.id.set(ADMIN);
    var revoked =
        service.reviewAchievement(
            extra.id(),
            new ReviewAchievementRequest(
                AchievementStatus.REVOKED, "Score correction", extra.version()));
    assertThat(service.rankings(null, 0, 20).getContent())
        .extracting(row -> row.userId())
        .containsExactly(OTHER, OWNER);
    assertThat(service.rankings(null, 0, 20).getContent())
        .extracting(row -> row.rank())
        .containsExactly(1L, 2L);
    assertThat(
            jdbc.queryForList(
                "SELECT points_delta FROM recognition_score_events WHERE user_id=? ORDER BY id",
                Integer.class,
                OWNER))
        .containsExactly(16, 16, -16);
    assertThat(service.profile(OWNER).publicPoints()).isZero();
    service.reviewAchievement(
        revoked.id(),
        new ReviewAchievementRequest(
            AchievementStatus.REVOKED, "Same decision", revoked.version()));
    users.id.set(OWNER);
    service.setPreferences(false);
    service.setPreferences(true);
    service.setVisibility(original.id(), true);
    assertThat(jdbc.queryForObject("SELECT count(*) FROM recognition_score_events", Long.class))
        .isEqualTo(4);
    assertThat(service.rankings(null, 0, 20).getContent())
        .extracting(row -> row.userId())
        .containsExactly(OTHER, OWNER);
    assertThat(service.rankings(null, 0, 20).getContent()).allMatch(row -> row.scoreTimingKnown());
  }

  @Test
  void allTimeAndEachAchievementYearHaveTheirOwnLatestScoreChange() {
    users.id.set(OWNER);
    service.setPreferences(true);
    approve(submit("Owner2026", true, AchievementAward.FIRST, DATE));
    users.id.set(OTHER);
    service.setPreferences(true);
    approve(submit("Other2026", true, AchievementAward.FIRST, DATE));
    users.id.set(OTHER);
    approve(submit("Other2025", true, AchievementAward.FIRST, DATE.minusYears(1)));
    users.id.set(OWNER);
    approve(submit("Owner2025", true, AchievementAward.FIRST, DATE.minusYears(1)));
    assertThat(service.rankings(null, 0, 20).getContent())
        .extracting(row -> row.userId())
        .containsExactly(OTHER, OWNER);
    assertThat(service.rankings(2026, 0, 20).getContent())
        .extracting(row -> row.userId())
        .containsExactly(OWNER, OTHER);
    assertThat(service.rankings(2025, 0, 20).getContent())
        .extracting(row -> row.userId())
        .containsExactly(OTHER, OWNER);
  }

  @Test
  void legacyAndExactTimestampTiesUseExplicitStableFallbackNotReviewOrSignupTime() {
    for (var id : List.of(OWNER, OTHER)) {
      users.id.set(id);
      service.setPreferences(true);
      var old = submit("Legacy16 " + id, false, AchievementAward.FIRST, DATE);
      jdbc.update(
          "UPDATE recognition_achievements SET status='APPROVED',reviewed_at='2000-01-01T00:00:00Z'"
              + " WHERE id=?",
          old.id());
    }
    users.id.set(THIRD);
    service.setPreferences(true);
    approve(submit("Known16", true, AchievementAward.FIRST, DATE));
    var rows = service.rankings(null, 0, 20).getContent();
    assertThat(rows).extracting(row -> row.userId()).containsExactly(THIRD, OWNER, OTHER);
    assertThat(rows).extracting(row -> row.scoreTimingKnown()).containsExactly(true, false, false);
    // A deliberate exact recorded-time tie exercises the final technical fallback.
    users.id.set(OTHER);
    var extra = approve(submit("Additional16", true, AchievementAward.FIRST, DATE));
    users.id.set(ADMIN);
    service.reviewAchievement(
        extra.id(),
        new ReviewAchievementRequest(AchievementStatus.REVOKED, "Return16", extra.version()));
    jdbc.update("UPDATE recognition_score_events SET recorded_at='2026-10-16T00:00:00Z'");
    assertThat(service.rankings(null, 0, 20).getContent())
        .extracting(row -> row.userId())
        .containsExactly(OTHER, THIRD, OWNER);
  }

  @Test
  void rolledBackApprovalDoesNotLeaveStateOrTimingAndRetryRecordsOnce() {
    users.id.set(OWNER);
    service.setPreferences(true);
    var pending = submit("Rollback16", true, AchievementAward.FIRST, DATE);
    users.id.set(ADMIN);
    assertThatThrownBy(
            () ->
                new TransactionTemplate(transactionManager)
                    .executeWithoutResult(
                        status -> {
                          service.reviewAchievement(
                              pending.id(),
                              new ReviewAchievementRequest(
                                  AchievementStatus.APPROVED, null, pending.version()));
                          throw new IllegalStateException("synthetic rollback");
                        }))
        .isInstanceOf(IllegalStateException.class);
    assertThat(
            jdbc.queryForObject(
                "SELECT status FROM recognition_achievements WHERE id=?",
                String.class,
                pending.id()))
        .isEqualTo("PENDING");
    assertThat(jdbc.queryForObject("SELECT count(*) FROM recognition_score_events", Long.class))
        .isZero();
    assertThat(service.rankings(null, 0, 20)).isEmpty();
    approve(pending);
    assertThat(jdbc.queryForObject("SELECT count(*) FROM recognition_score_events", Long.class))
        .isEqualTo(1);
  }

  @Test
  void differentAchievementsApprovedConcurrentlyKeepBothEventsAndPoints() throws Exception {
    users.id.set(OWNER);
    service.setPreferences(true);
    var first = submit("Concurrent A", true, AchievementAward.FIRST, DATE);
    var second = submit("Concurrent B", true, AchievementAward.FIRST, DATE);
    var start = new CountDownLatch(1);
    try (var pool = Executors.newFixedThreadPool(2)) {
      var jobs =
          List.of(first, second).stream()
              .map(
                  pending ->
                      pool.submit(
                          () -> {
                            users.id.set(ADMIN);
                            start.await();
                            return service.reviewAchievement(
                                pending.id(),
                                new ReviewAchievementRequest(
                                    AchievementStatus.APPROVED, null, pending.version()));
                          }))
              .toList();
      start.countDown();
      for (var job : jobs) {
        assertThat(job.get(10, TimeUnit.SECONDS).status()).isEqualTo(AchievementStatus.APPROVED);
      }
    }
    assertThat(score(OWNER, null)).isEqualTo(32);
    assertThat(jdbc.queryForObject("SELECT count(*) FROM recognition_score_events", Long.class))
        .isEqualTo(2);
    assertThat(
            jdbc.queryForObject(
                "SELECT sum(points_delta) FROM recognition_score_events", Long.class))
        .isEqualTo(32);
  }

  @Test
  void reviewWaitsForStudentLockBeforeRecordingAttainment() throws Exception {
    users.id.set(OWNER);
    var pending = submit("Locked16", true, AchievementAward.FIRST, DATE);
    var locked = new CountDownLatch(1);
    var release = new CountDownLatch(1);
    try (var pool = Executors.newFixedThreadPool(2)) {
      var locker =
          pool.submit(
              () ->
                  new TransactionTemplate(transactionManager)
                      .executeWithoutResult(
                          status -> {
                            jdbc.queryForObject(
                                "SELECT id FROM users WHERE id=? FOR UPDATE", UUID.class, OWNER);
                            locked.countDown();
                            try {
                              if (!release.await(15, TimeUnit.SECONDS)) {
                                throw new IllegalStateException("lock release timeout");
                              }
                            } catch (InterruptedException e) {
                              Thread.currentThread().interrupt();
                              throw new IllegalStateException(e);
                            }
                          }));
      assertThat(locked.await(10, TimeUnit.SECONDS)).isTrue();
      var review =
          pool.submit(
              () -> {
                users.id.set(ADMIN);
                return service.reviewAchievement(
                    pending.id(),
                    new ReviewAchievementRequest(
                        AchievementStatus.APPROVED, null, pending.version()));
              });
      try {
        long blocked = 0;
        for (int i = 0; i < 200 && blocked == 0; i++) {
          blocked =
              jdbc.queryForObject(
                  "SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND"
                      + " wait_event_type='Lock' AND query ILIKE '%users%'",
                  Long.class);
          if (blocked == 0) {
            Thread.sleep(20);
          }
        }
        assertThat(blocked).isPositive();
        assertThat(review.isDone()).isFalse();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM recognition_score_events", Long.class))
            .isZero();
      } finally {
        release.countDown();
      }
      locker.get(10, TimeUnit.SECONDS);
      assertThat(review.get(10, TimeUnit.SECONDS).status()).isEqualTo(AchievementStatus.APPROVED);
    }
  }

  private void assertPublicProjection() {
    assertThat(PublicAchievementResponse.class.getRecordComponents())
        .extracting(RecordComponent::getName)
        .doesNotContain(
            "evidence", "reviewNote", "reviewedAt", "reviewedBy", "submittedBy", "version");
  }

  private AchievementResponse submit(
      String title, boolean visible, AchievementAward award, LocalDate date) {
    return service.submitAchievement(
        claim(null, title, visible, award, date), List.of(proof()), false);
  }

  private SubmitAchievementRequest claim(
      UUID owner, String title, boolean visible, AchievementAward award, LocalDate date) {
    return new SubmitAchievementRequest(
        owner,
        title,
        "Academic result",
        AchievementCategory.OLYMPIC_NATIONAL,
        award,
        true,
        date,
        visible);
  }

  private AchievementResponse approve(AchievementResponse pending) {
    users.id.set(ADMIN);
    return service.reviewAchievement(
        pending.id(),
        new ReviewAchievementRequest(AchievementStatus.APPROVED, null, pending.version()));
  }

  private MockMultipartFile proof() {
    return new MockMultipartFile("evidence", "certificate.png", "image/png", PNG);
  }

  private long score(UUID id, Integer year) {
    return service.rankings(year, 0, 50).getContent().stream()
        .filter(row -> row.userId().equals(id))
        .mapToLong(row -> row.totalPoints())
        .findFirst()
        .orElse(0);
  }

  @TestConfiguration
  static class Dependencies {
    @Bean
    Clock clock() {
      return Clock.fixed(Instant.parse("2026-10-02T00:00:00Z"), ZoneOffset.UTC);
    }

    @Bean
    TestUsers testUsers() {
      return new TestUsers();
    }
  }

  static class TestUsers implements CurrentUserProvider {
    final ThreadLocal<UUID> id = ThreadLocal.withInitial(() -> OWNER);

    @Override
    public CurrentUser getCurrentUser() {
      UUID userId = id.get();
      Role role =
          userId.equals(ADMIN)
              ? Role.ADMIN
              : userId.equals(LECTURER) ? Role.LECTURER : Role.STUDENT;
      return new CurrentUser(
          userId,
          userId + "@test.invalid",
          userId.toString(),
          "Test user",
          role,
          Status.ACTIVE,
          List.of());
    }
  }
}
