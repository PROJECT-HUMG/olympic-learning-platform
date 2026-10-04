package me.nghlong3004.olympic.recognition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
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
import me.nghlong3004.olympic.recognition.service.RecognitionService;
import me.nghlong3004.olympic.recognition.service.RecognitionUploadPolicy;
import me.nghlong3004.olympic.recognition.service.impl.RecognitionServiceImpl;
import me.nghlong3004.olympic.user.exception.UserDisabledException;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
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
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
@DataJpaTest(properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true"}, showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({RecognitionServiceImpl.class, RecognitionUploadPolicy.class, RecognitionMapperImpl.class,
    RecognitionIntegrationTest.Dependencies.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers(disabledWithoutDocker = true)
class RecognitionIntegrationTest {
  @Container @ServiceConnection
  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");
  private static final UUID OWNER = UUID.fromString("00000000-0000-0000-0000-000000009001");
  private static final UUID OTHER = UUID.fromString("00000000-0000-0000-0000-000000009002");
  private static final UUID THIRD = UUID.fromString("00000000-0000-0000-0000-000000009003");
  private static final UUID ADMIN = UUID.fromString("00000000-0000-0000-0000-000000009004");
  private static final UUID LECTURER = UUID.fromString("00000000-0000-0000-0000-000000009005");
  private static final LocalDate DATE = LocalDate.of(2026, 9, 1);
  private static final byte[] PNG = Base64.getDecoder().decode(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1sAAAAASUVORK5CYII=");
  @Autowired private RecognitionService service;
  @Autowired private JdbcTemplate jdbc;
  @Autowired private TestUsers users;

  @BeforeEach
  void resetDatabaseAndStudents() {
    jdbc.update("DELETE FROM recognition_files");
    jdbc.update("DELETE FROM recognition_honors");
    jdbc.update("DELETE FROM recognition_achievements");
    jdbc.update("DELETE FROM recognition_preferences");
    jdbc.update("DELETE FROM users WHERE id IN (?,?,?,?,?)", OWNER, OTHER, THIRD, ADMIN, LECTURER);
    for (UUID id : List.of(OWNER, OTHER, THIRD, ADMIN, LECTURER)) {
      String role = id.equals(ADMIN) ? "ADMIN" : id.equals(LECTURER) ? "LECTURER" : "STUDENT";
      jdbc.update("INSERT INTO users(id,email,username,full_name,role,status) VALUES (?,?,?,?,?::user_role,'ACTIVE')",
          id, id + "@test.invalid", id.toString(), "User " + id.toString().substring(32), role);
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
    var repeat = service.reviewAchievement(approved.id(),
        new ReviewAchievementRequest(AchievementStatus.APPROVED, null, approved.version()));
    assertThat(repeat.totalPoints()).isEqualTo(16);
    assertThat(score(OWNER, null)).isEqualTo(16);
    assertThat(service.rankings(null, 0, 20).getContent().getFirst().approvedCount()).isEqualTo(1);
    service.reviewAchievement(repeat.id(),
        new ReviewAchievementRequest(AchievementStatus.REVOKED, "Invalid evidence confirmed", repeat.version()));
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
    assertThat(profile.achievements().getFirst().evidence()).isEmpty();
    assertThat(profile.achievements().getFirst().reviewNote()).isNull();
    assertThat(profile.achievements().getFirst().reviewedAt()).isNull();
    service.setVisibility(approved.id(), false);
    assertThat(score(OWNER, null)).isEqualTo(16);
    assertThat(service.profile(OWNER).publicPoints()).isZero();
    users.id.set(OTHER);
    assertThatThrownBy(() -> service.setVisibility(approved.id(), true)).isInstanceOf(ApiException.class);
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
  void yearUsesAchievementDateAndTiesUseCompetitionRanksAcrossPages() {
    for (UUID id : List.of(OWNER, OTHER, THIRD)) {
      users.id.set(id);
      service.setPreferences(true);
      approve(submit("2026 " + id, true, id.equals(THIRD) ? AchievementAward.SECOND : AchievementAward.FIRST, DATE));
    }
    var yearly = service.rankings(2026, 0, 20).getContent();
    assertThat(yearly).extracting(row -> row.rank()).containsExactly(1L, 1L, 3L);
    assertThat(yearly).extracting(row -> row.userId()).containsExactly(OWNER, OTHER, THIRD);
    assertThat(service.rankings(2026, 1, 1).getContent().getFirst().rank()).isEqualTo(1);
    assertThat(service.rankings(2026, 2, 1).getContent().getFirst().rank()).isEqualTo(3);
    users.id.set(OWNER);
    approve(submit("Older award approved now", true, AchievementAward.SECOND, LocalDate.of(2025, 9, 1)));
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
    assertThat(service.adminListAchievements(AchievementStatus.PENDING, OWNER, 0, 20).getContent()).hasSize(1);
    for (UUID id : List.of(OWNER, OTHER, LECTURER)) {
      users.id.set(id);
      assertThatThrownBy(() -> service.reviewAchievement(pending.id(),
          new ReviewAchievementRequest(AchievementStatus.APPROVED, null, pending.version())))
          .isInstanceOf(ApiException.class);
      assertThatThrownBy(() -> service.adminListAchievements(null, null, 0, 20)).isInstanceOf(ApiException.class);
    }
    var approved = approve(pending);
    assertThatThrownBy(() -> service.reviewAchievement(approved.id(),
        new ReviewAchievementRequest(AchievementStatus.REVOKED, "Old screen", pending.version())))
        .isInstanceOf(ApiException.class)
        .matches(error -> ((ApiException) error).getErrorCode() == ErrorCode.RECOGNITION_CONFLICT);
    assertThatThrownBy(() -> service.reviewAchievement(approved.id(),
        new ReviewAchievementRequest(AchievementStatus.REVOKED, " ", approved.version())))
        .isInstanceOf(ApiException.class);
    jdbc.update("UPDATE users SET role='STUDENT' WHERE id=?", ADMIN);
    assertThatThrownBy(() -> service.reviewAchievement(approved.id(),
        new ReviewAchievementRequest(AchievementStatus.REVOKED, "Stale admin token", approved.version())))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void duplicateReviewRacesCannotCreditTwice() throws Exception {
    service.setPreferences(true);
    var pending = submit("Concurrent review", true, AchievementAward.FIRST, DATE);
    try (var pool = Executors.newFixedThreadPool(2)) {
      Callable<Boolean> task = () -> {
        users.id.set(ADMIN);
        try {
          service.reviewAchievement(pending.id(),
              new ReviewAchievementRequest(AchievementStatus.APPROVED, null, pending.version()));
          return true;
        } catch (ApiException conflict) {
          assertThat(conflict.getErrorCode()).isEqualTo(ErrorCode.RECOGNITION_CONFLICT);
          return false;
        }
      };
      var first = pool.submit(task);
      var second = pool.submit(task);
      assertThat(List.of(first.get(20, TimeUnit.SECONDS), second.get(20, TimeUnit.SECONDS))).contains(true);
    }
    assertThat(score(OWNER, null)).isEqualTo(16);
    assertThat(service.rankings(null, 0, 20).getContent().getFirst().approvedCount()).isEqualTo(1);
  }

  @Test
  void concurrentDuplicateSubmissionsLeaveOneClaimAndOnePrivateProof() throws Exception {
    try (var pool = Executors.newFixedThreadPool(2)) {
      Callable<Boolean> task = () -> {
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
    assertThat(jdbc.queryForObject("SELECT count(*) FROM recognition_files", Long.class)).isEqualTo(1);
  }

  @Test
  void evidenceIsOwnerOrAdminOnlyEvenForPublishedAchievement() {
    var pending = submit("Sensitive certificate", true, AchievementAward.FIRST, DATE);
    var file = pending.evidence().getFirst();
    assertThat(file.url()).isNull();
    assertThat(service.getEvidence(pending.id(), file.id()).content()).isEqualTo(PNG);
    users.id.set(OTHER);
    assertThatThrownBy(() -> service.getEvidence(pending.id(), file.id())).isInstanceOf(ApiException.class);
    users.id.set(LECTURER);
    assertThatThrownBy(() -> service.getEvidence(pending.id(), file.id())).isInstanceOf(ApiException.class);
    approve(pending);
    assertThat(service.getEvidence(pending.id(), file.id()).content()).isEqualTo(PNG);
    assertThat(service.profile(OWNER).achievements().getFirst().evidence()).isEmpty();
    users.id.set(OTHER);
    var other = submit("Other certificate", true, AchievementAward.FIRST, DATE);
    users.id.set(OWNER);
    assertThatThrownBy(() -> service.getEvidence(pending.id(), other.evidence().getFirst().id()))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void evidenceLimitsAndRealContentAreValidatedBeforeAnyRecordIsStored() {
    var input = claim(null, "Bad proof", true, AchievementAward.FIRST, DATE);
    assertThatThrownBy(() -> service.submitAchievement(input, List.of(), false)).isInstanceOf(ApiException.class);
    var fake = new MockMultipartFile("evidence", "certificate.png", "image/png", "<svg onload='alert(1)'/>".getBytes());
    assertThatThrownBy(() -> service.submitAchievement(input, List.of(fake), false)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.submitAchievement(input, List.of(proof(), proof(), proof(), proof()), false))
        .isInstanceOf(ApiException.class);
    byte[] oversized = new byte[5 * 1024 * 1024 + 1];
    System.arraycopy(PNG, 0, oversized, 0, PNG.length);
    assertThatThrownBy(() -> service.submitAchievement(input,
        List.of(new MockMultipartFile("evidence", "oversize.png", "image/png", oversized)), false))
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
    assertThatThrownBy(() -> service.submitAchievement(
        claim(null, "Future result", true, AchievementAward.FIRST, LocalDate.of(2026, 10, 3)), List.of(proof()), false))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.submitAchievement(
        claim(null, "Unsupported historical date", true, AchievementAward.FIRST, LocalDate.of(1899, 12, 31)), List.of(proof()), false))
        .isInstanceOf(ApiException.class);
    assertThat(service.listMyAchievements()).isEmpty();
  }

  @Test
  void replacingProofAloneInvalidatesAnAlreadyOpenReview() {
    var original = submit("Same metadata new proof", false, AchievementAward.FIRST, DATE);
    var replaced = service.updateAchievement(original.id(),
        claim(null, "Same metadata new proof", false, AchievementAward.FIRST, DATE), List.of(proof()));
    assertThat(replaced.version()).isGreaterThan(original.version());
    assertThat(replaced.evidence().getFirst().id()).isNotEqualTo(original.evidence().getFirst().id());
    users.id.set(ADMIN);
    assertThatThrownBy(() -> service.reviewAchievement(original.id(),
        new ReviewAchievementRequest(AchievementStatus.APPROVED, null, original.version())))
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
    assertThatThrownBy(() -> service.submitAchievement(
        claim(OWNER, "Impersonation", true, AchievementAward.FIRST, DATE), List.of(proof()), false))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.updateAchievement(pending.id(),
        claim(null, "Stolen record", true, AchievementAward.FIRST, DATE), List.of(proof())))
        .isInstanceOf(ApiException.class);
    var approved = approve(pending);
    users.id.set(OWNER);
    assertThatThrownBy(() -> service.updateAchievement(approved.id(),
        claim(null, "Changed after approval", true, AchievementAward.SECOND, DATE), List.of(proof())))
        .isInstanceOf(ApiException.class);
    users.id.set(ADMIN);
    var onBehalf = service.submitAchievement(claim(OTHER, "Admin entered award", true, AchievementAward.FIRST, DATE),
        List.of(proof()), true);
    assertThat(onBehalf.userId()).isEqualTo(OTHER);
    assertThat(onBehalf.status()).isEqualTo(AchievementStatus.PENDING);
  }

  @Test
  void rejectionRequiresReasonAndResubmissionRequiresFreshReview() {
    var pending = submit("Needs correction", true, AchievementAward.FIRST, DATE);
    users.id.set(ADMIN);
    assertThatThrownBy(() -> service.reviewAchievement(pending.id(),
        new ReviewAchievementRequest(AchievementStatus.REJECTED, null, pending.version())))
        .isInstanceOf(ApiException.class);
    var rejected = service.reviewAchievement(pending.id(),
        new ReviewAchievementRequest(AchievementStatus.REJECTED, "Certificate missing details", pending.version()));
    assertThat(rejected.status()).isEqualTo(AchievementStatus.REJECTED);
    users.id.set(OWNER);
    var resubmitted = service.updateAchievement(rejected.id(),
        claim(null, "Corrected certificate", true, AchievementAward.SECOND, DATE), List.of(proof()));
    assertThat(resubmitted.status()).isEqualTo(AchievementStatus.PENDING);
    assertThat(service.profile(OWNER).achievements()).isEmpty();
  }

  @Test
  void rejectedHistoryRemainsOwnedButCannotBeResubmittedOverANewActiveClaim() {
    var first = submit("Same academic event", false, AchievementAward.FIRST, DATE);
    users.id.set(ADMIN);
    service.reviewAchievement(first.id(),
        new ReviewAchievementRequest(AchievementStatus.REJECTED, "Replace certificate", first.version()));
    users.id.set(OWNER);
    var replacement = submit("Same academic event", false, AchievementAward.SECOND, DATE);
    assertThatThrownBy(() -> service.updateAchievement(first.id(),
        claim(null, "Same academic event", false, AchievementAward.FIRST, DATE), List.of(proof())))
        .isInstanceOf(ApiException.class);
    var own = service.listMyAchievements();
    assertThat(own).hasSize(2);
    assertThat(own).extracting(AchievementResponse::status)
        .containsExactlyInAnyOrder(AchievementStatus.REJECTED, AchievementStatus.PENDING);
    approve(replacement);
    users.id.set(OWNER);
    assertThat(service.listMyAchievements()).extracting(AchievementResponse::status)
        .containsExactlyInAnyOrder(AchievementStatus.REJECTED, AchievementStatus.APPROVED);
    assertThat(service.listMyAchievements()).allSatisfy(row -> assertThat(row.evidence()).hasSize(1));
    assertThat(service.profile(OWNER).achievements()).isEmpty();
  }

  @Test
  void closedClaimsCannotExceedPendingCapacityWhilePendingCorrectionsRemainAllowed() {
    var pending = submit("Existing pending", false, AchievementAward.FIRST, DATE);
    var rejected = submit("Rejected before full queue", false, AchievementAward.FIRST, DATE);
    users.id.set(ADMIN);
    service.reviewAchievement(rejected.id(),
        new ReviewAchievementRequest(AchievementStatus.REJECTED, "Evidence incomplete", rejected.version()));
    users.id.set(OWNER);
    var revoked = approve(submit("Revoked before full queue", false, AchievementAward.FIRST, DATE));
    service.reviewAchievement(revoked.id(),
        new ReviewAchievementRequest(AchievementStatus.REVOKED, "Award withdrawn", revoked.version()));
    users.id.set(OWNER);
    jdbc.update("""
        INSERT INTO recognition_achievements
          (id,user_id,title,category,award,include_participation,achieved_date,
           public_visible,status,award_points,participation_points,submitted_by,created_at,updated_at)
        SELECT gen_random_uuid(),?,'Pending fixture ' || sequence,'OLYMPIC_NATIONAL','FIRST',false,
          DATE '2026-09-01',false,'PENDING',10,0,?,now(),now()
        FROM generate_series(1,49) AS sequence
        """, OWNER, OWNER);
    for (var closed : List.of(rejected, revoked)) {
      assertThatThrownBy(() -> service.updateAchievement(closed.id(),
          claim(null, closed.title(), false, AchievementAward.FIRST, DATE), List.of(proof())))
          .isInstanceOf(ApiException.class)
          .matches(error -> ((ApiException) error).getErrorCode() == ErrorCode.RECOGNITION_CONFLICT);
    }
    var history = service.listMyAchievements();
    var savedRejected = history.stream().filter(row -> row.id().equals(rejected.id())).findFirst().orElseThrow();
    var savedRevoked = history.stream().filter(row -> row.id().equals(revoked.id())).findFirst().orElseThrow();
    assertThat(savedRejected.status()).isEqualTo(AchievementStatus.REJECTED);
    assertThat(savedRevoked.status()).isEqualTo(AchievementStatus.REVOKED);
    assertThat(savedRejected.evidence().getFirst().id()).isEqualTo(rejected.evidence().getFirst().id());
    assertThat(savedRevoked.evidence().getFirst().id()).isEqualTo(revoked.evidence().getFirst().id());
    var corrected = service.updateAchievement(pending.id(),
        claim(null, pending.title(), false, AchievementAward.FIRST, DATE), List.of(proof()));
    assertThat(corrected.status()).isEqualTo(AchievementStatus.PENDING);
    assertThat(corrected.version()).isGreaterThan(pending.version());
    assertThat(jdbc.queryForObject("SELECT count(*) FROM recognition_achievements WHERE status='PENDING'", Long.class))
        .isEqualTo(50);
  }

  @Test
  void draftHonorsAndPhotosRemainProtectedWhileManualAndAccountParticipantsKeepOrder() {
    users.id.set(ADMIN);
    var participants = List.of(new HonorParticipantRequest(OWNER, null, "First"),
        new HonorParticipantRequest(null, "Guest researcher", "Team member"));
    var draft = service.saveHonor(null, new SaveHonorRequest("Academic memory", "Math", 2026,
        "Team memories", HonorScope.NATIONAL, HonorStatus.DRAFT, participants, null));
    var gallery = service.addPhotos(draft.id(), List.of(proof()));
    assertThat(gallery.version()).isGreaterThan(draft.version());
    var photoId = gallery.photos().getFirst().id();
    assertThatThrownBy(() -> service.getHonor(draft.id(), false)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.getPhoto(draft.id(), photoId, false)).isInstanceOf(ApiException.class);
    assertThat(service.listHonors(null, null, 0, 20, false).getContent()).isEmpty();
    users.id.set(OTHER);
    assertThatThrownBy(() -> service.getHonor(draft.id(), true)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.deleteHonor(draft.id())).isInstanceOf(ApiException.class);
    users.id.set(ADMIN);
    var published = service.saveHonor(draft.id(), new SaveHonorRequest("Academic memory", "Math", 2026,
        "Team memories", HonorScope.NATIONAL, HonorStatus.PUBLISHED, participants, gallery.version()));
    assertThat(published.participants()).extracting(row -> row.userId()).containsExactly(OWNER, null);
    assertThat(published.participants().get(1).fullName()).isEqualTo("Guest researcher");
    assertThat(service.getHonor(draft.id(), false).status()).isEqualTo(HonorStatus.PUBLISHED);
    assertThat(service.listHonors(2026, "math", 0, 20, false).getContent()).hasSize(1);
    assertThat(service.listHonors(2025, null, 0, 20, false).getContent()).isEmpty();
    assertThat(service.listHonors(null, "Physics", 0, 20, false).getContent()).isEmpty();
    assertThat(service.getPhoto(draft.id(), photoId, false).content()).isEqualTo(PNG);
    assertThatThrownBy(() -> service.saveHonor(draft.id(), new SaveHonorRequest("Old editor", "Math", 2026,
        "Old contents", HonorScope.NATIONAL, HonorStatus.DRAFT, participants, gallery.version())))
        .isInstanceOf(ApiException.class)
        .matches(error -> ((ApiException) error).getErrorCode() == ErrorCode.RECOGNITION_CONFLICT);
    assertThat(service.profile(OWNER).publicPoints()).isZero();
    assertThat(jdbc.queryForObject("SELECT count(*) FROM recognition_achievements", Long.class)).isZero();
  }

  private AchievementResponse submit(String title, boolean visible, AchievementAward award, LocalDate date) {
    return service.submitAchievement(claim(null, title, visible, award, date), List.of(proof()), false);
  }

  private SubmitAchievementRequest claim(UUID owner, String title, boolean visible, AchievementAward award, LocalDate date) {
    return new SubmitAchievementRequest(owner, title, "Academic result", AchievementCategory.OLYMPIC_NATIONAL,
        award, true, date, visible);
  }

  private AchievementResponse approve(AchievementResponse pending) {
    users.id.set(ADMIN);
    return service.reviewAchievement(pending.id(),
        new ReviewAchievementRequest(AchievementStatus.APPROVED, null, pending.version()));
  }

  private MockMultipartFile proof() {
    return new MockMultipartFile("evidence", "certificate.png", "image/png", PNG);
  }

  private long score(UUID id, Integer year) {
    return service.rankings(year, 0, 50).getContent().stream()
        .filter(row -> row.userId().equals(id)).mapToLong(row -> row.totalPoints()).findFirst().orElse(0);
  }

  @TestConfiguration
  static class Dependencies {
    @Bean Clock clock() { return Clock.fixed(Instant.parse("2026-10-02T00:00:00Z"), ZoneOffset.UTC); }
    @Bean TestUsers testUsers() { return new TestUsers(); }
  }

  static class TestUsers implements CurrentUserProvider {
    final ThreadLocal<UUID> id = ThreadLocal.withInitial(() -> OWNER);
    @Override public CurrentUser getCurrentUser() {
      UUID userId = id.get();
      Role role = userId.equals(ADMIN) ? Role.ADMIN : userId.equals(LECTURER) ? Role.LECTURER : Role.STUDENT;
      return new CurrentUser(userId, userId + "@test.invalid", userId.toString(), "Test user", role,
          Status.ACTIVE, List.of());
    }
  }
}
