package me.nghlong3004.olympic.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Set;
import java.util.stream.IntStream;
import me.nghlong3004.olympic.user.entity.User;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import javax.sql.DataSource;
import me.nghlong3004.olympic.auth.enums.AuthEmailTokenPurpose;
import me.nghlong3004.olympic.auth.mapper.AuthMapper;
import me.nghlong3004.olympic.auth.repository.AuthRegistrationChallengeRepository;
import me.nghlong3004.olympic.auth.request.ChangeRegistrationEmailRequest;
import me.nghlong3004.olympic.auth.request.LoginRequest;
import me.nghlong3004.olympic.auth.request.RegisterRequest;
import me.nghlong3004.olympic.auth.request.ResetPasswordRequest;
import me.nghlong3004.olympic.auth.request.RegistrationSessionRequest;
import me.nghlong3004.olympic.auth.request.VerifyEmailRequest;
import me.nghlong3004.olympic.auth.request.VerifyRegistrationRequest;
import me.nghlong3004.olympic.auth.response.RegistrationChallengeResponse;
import me.nghlong3004.olympic.auth.service.AuthEmailTokenService;
import me.nghlong3004.olympic.auth.service.AuthService;
import me.nghlong3004.olympic.auth.service.RegistrationRateLimitService;
import me.nghlong3004.olympic.auth.service.RegistrationVerificationService;
import me.nghlong3004.olympic.auth.service.RefreshTokenService;
import me.nghlong3004.olympic.auth.service.TokenService;
import me.nghlong3004.olympic.auth.service.impl.AuthEmailTokenServiceImpl;
import me.nghlong3004.olympic.auth.service.impl.AuthServiceImpl;
import me.nghlong3004.olympic.auth.service.impl.RegistrationRateLimitServiceImpl;
import me.nghlong3004.olympic.auth.service.impl.RegistrationVerificationServiceImpl;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.mail.event.MailSendEvent;
import me.nghlong3004.olympic.common.mail.model.RegistrationOtpMailModel;
import me.nghlong3004.olympic.common.properties.AuthProperties;
import me.nghlong3004.olympic.common.properties.ClientProperties;
import me.nghlong3004.olympic.common.properties.UserProperties;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.common.util.AuthLinkBuilder;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@DataJpaTest(properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true", "logging.level.org.hibernate.SQL=OFF", "logging.level.org.hibernate.orm.jdbc.bind=OFF"}, showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({AuthServiceImpl.class, AuthEmailTokenServiceImpl.class, RegistrationVerificationServiceImpl.class,
    RegistrationRateLimitServiceImpl.class, RegistrationOtpIntegrationTest.Dependencies.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@RecordApplicationEvents
@Testcontainers(disabledWithoutDocker = true)
class RegistrationOtpIntegrationTest {
  @Container @ServiceConnection
  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");

  @Autowired private AuthService auth;
  @Autowired private RegistrationVerificationService verification;
  @Autowired private RegistrationRateLimitService limits;
  @Autowired private AuthEmailTokenService emailTokens;
  @Autowired private UserRepository users;
  @Autowired private AuthRegistrationChallengeRepository challenges;
  @Autowired private ApplicationEvents events;
  @Autowired private MutableClock clock;
  @Autowired private PasswordEncoder passwordEncoder;
  @MockitoBean private RefreshTokenService refresh;
  @MockitoBean private TokenService tokens;
  @MockitoBean private StorageService storage;
  @MockitoBean private CurrentUserProvider current;

  private String password;
  private String identifier;
  private String email;
  private String ip;

  @BeforeEach
  void fixture() {
    clock.instant = Instant.parse("2026-10-02T00:00:00Z");
    identifier = UUID.randomUUID().toString();
    email = identifier + "@example.invalid";
    password = UUID.randomUUID().toString();
    ip = UUID.randomUUID().toString();
  }

  private RegistrationChallengeResponse register() {
    return auth.register(new RegisterRequest(email, identifier, "Test Student", password), ip, "test").verification();
  }

  private String latestCode() {
    return events.stream(MailSendEvent.class).map(MailSendEvent::model)
        .filter(RegistrationOtpMailModel.class::isInstance).map(RegistrationOtpMailModel.class::cast)
        .reduce((first, second) -> second).orElseThrow().code();
  }

  private void fails(ErrorCode expected, Runnable action) {
    assertThatThrownBy(action::run).isInstanceOfSatisfying(ApiException.class,
        error -> assertThat(error.getErrorCode()).isEqualTo(expected));
  }

  @Test
  void remainsPendingUntilCorrectOtpAndRepeatedSuccessIsSafe() {
    var session = register();
    var code = latestCode();
    assertThat(code).matches("[0-9]{6}");
    assertThat(session.verificationSession()).hasSize(64);
    assertThat(users.findByEmailIgnoreCaseAndDeletedAtIsNull(email).orElseThrow().getStatus()).isEqualTo(Status.PENDING);
    var user = users.findByEmailIgnoreCaseAndDeletedAtIsNull(email).orElseThrow();
    var saved = challenges.findByUserId(user.getId()).orElseThrow();
    assertThat(saved.getCodeHash()).doesNotContain(code);
    assertThat(saved.getSessionHash()).isNotEqualTo(session.verificationSession());
    verification.verify(new VerifyRegistrationRequest(session.verificationSession(), code), ip);
    verification.verify(new VerifyRegistrationRequest(session.verificationSession(), code), ip);
    assertThat(users.findById(user.getId()).orElseThrow().getStatus()).isEqualTo(Status.ACTIVE);
    fails(ErrorCode.REGISTRATION_ALREADY_VERIFIED,
        () -> verification.changeEmail(new ChangeRegistrationEmailRequest(session.verificationSession(), "new@example.invalid"), ip));
  }

  @Test
  void wrongAttemptsPersistAcrossSeparateErrorTransactionsAndFifthLocksEvenCorrectCode() {
    var session = register();
    var correct = latestCode();
    var wrong = correct.equals("000000") ? "000001" : "000000";
    for (var attempt = 1; attempt <= 5; attempt++) {
      var expected = attempt == 5 ? ErrorCode.REGISTRATION_OTP_LOCKED : ErrorCode.REGISTRATION_OTP_INVALID;
      fails(expected, () -> verification.verify(new VerifyRegistrationRequest(session.verificationSession(), wrong), ip));
    }
    fails(ErrorCode.REGISTRATION_OTP_LOCKED,
        () -> verification.verify(new VerifyRegistrationRequest(session.verificationSession(), correct), ip));
    var user = users.findByEmailIgnoreCaseAndDeletedAtIsNull(email).orElseThrow();
    assertThat(challenges.findByUserId(user.getId()).orElseThrow().getFailedAttempts()).isEqualTo(5);
    assertThat(user.getStatus()).isEqualTo(Status.PENDING);
    clock.advance(Duration.ofSeconds(60));
    verification.resend(new RegistrationSessionRequest(session.verificationSession()), ip);
    verification.verify(new VerifyRegistrationRequest(session.verificationSession(), latestCode()), ip);
    assertThat(users.findById(user.getId()).orElseThrow().getStatus()).isEqualTo(Status.ACTIVE);
  }

  @Test
  void expiredCodeCanBeResentButExpiredSessionRequiresPasswordRecovery() {
    var session = register();
    var code = latestCode();
    clock.advance(Duration.ofMinutes(10));
    fails(ErrorCode.REGISTRATION_OTP_EXPIRED,
        () -> verification.verify(new VerifyRegistrationRequest(session.verificationSession(), code), ip));
    verification.resend(new RegistrationSessionRequest(session.verificationSession()), ip);
    var replacement = latestCode();
    assertThat(replacement).isNotEqualTo(code);
    clock.advance(Duration.ofMinutes(50));
    fails(ErrorCode.REGISTRATION_SESSION_INVALID,
        () -> verification.verify(new VerifyRegistrationRequest(session.verificationSession(), replacement), ip));
    var resumed = verification.resume(new LoginRequest(identifier, password), ip);
    verification.verify(new VerifyRegistrationRequest(resumed.verificationSession(), latestCode()), ip);
  }

  @Test
  void emailCorrectionRevokesPreviousOtpAndLegacyLinksWithoutChangingOriginalAccountIdentity() {
    var session = register();
    var code = latestCode();
    var user = users.findByEmailIgnoreCaseAndDeletedAtIsNull(email).orElseThrow();
    var legacy = emailTokens.issue(user, AuthEmailTokenPurpose.EMAIL_VERIFICATION, Duration.ofHours(1), ip, "test");
    var changed = verification.changeEmail(new ChangeRegistrationEmailRequest(session.verificationSession(), "correct-" + email), ip);
    var replacement = latestCode();
    assertThat(changed.email()).isEqualTo("correct-" + email);
    var sent = events.stream(MailSendEvent.class).map(MailSendEvent::model)
        .filter(RegistrationOtpMailModel.class::isInstance).map(RegistrationOtpMailModel.class::cast)
        .reduce((first, second) -> second).orElseThrow();
    assertThat(sent.recipientEmail()).isEqualTo(changed.email());
    assertThat(users.findByEmailIgnoreCaseAndDeletedAtIsNull(changed.email()).orElseThrow().getId()).isEqualTo(user.getId());
    fails(ErrorCode.REGISTRATION_OTP_INVALID,
        () -> verification.verify(new VerifyRegistrationRequest(session.verificationSession(), code), ip));
    fails(ErrorCode.EMAIL_TOKEN_INVALID, () -> auth.verifyEmail(new VerifyEmailRequest(legacy.token())));
    verification.verify(new VerifyRegistrationRequest(changed.verificationSession(), replacement), ip);
  }

  @Test
  void emailCollisionAndInvalidSessionCannotChangeAnAccountOrSendMail() {
    var session = register();
    var existingEmail = "other-" + email;
    users.save(User.builder().email(existingEmail).username("other-" + identifier).build());
    var count = events.stream(MailSendEvent.class).count();
    fails(ErrorCode.DUPLICATE_RESOURCE,
        () -> verification.changeEmail(new ChangeRegistrationEmailRequest(session.verificationSession(), existingEmail), ip));
    fails(ErrorCode.REGISTRATION_SESSION_INVALID,
        () -> verification.changeEmail(new ChangeRegistrationEmailRequest("x".repeat(64), existingEmail), ip));
    assertThat(users.findByEmailIgnoreCaseAndDeletedAtIsNull(email)).isPresent();
    assertThat(events.stream(MailSendEvent.class).count()).isEqualTo(count);
  }

  @Test
  void recoveryRequiresPasswordAndRotatesSessionWithoutBypassingCooldown() {
    var session = register();
    fails(ErrorCode.INVALID_CREDENTIALS, () -> verification.resume(new LoginRequest(identifier, UUID.randomUUID().toString()), ip));
    fails(ErrorCode.REGISTRATION_COOLDOWN, () -> verification.resume(new LoginRequest(identifier, password), ip));
    clock.advance(Duration.ofSeconds(60));
    var resumed = verification.resume(new LoginRequest(identifier, password), ip);
    var newCode = latestCode();
    assertThat(resumed.verificationSession()).isNotEqualTo(session.verificationSession());
    fails(ErrorCode.REGISTRATION_SESSION_INVALID,
        () -> verification.verify(new VerifyRegistrationRequest(session.verificationSession(), newCode), ip));
    verification.verify(new VerifyRegistrationRequest(resumed.verificationSession(), newCode), ip);
  }

  @Test
  void resendEnforcesSixtySecondCooldownAndRevokesPreviousCode() {
    var session = register();
    var old = latestCode();
    fails(ErrorCode.REGISTRATION_COOLDOWN,
        () -> verification.resend(new RegistrationSessionRequest(session.verificationSession()), ip));
    clock.advance(Duration.ofSeconds(60));
    verification.resend(new RegistrationSessionRequest(session.verificationSession()), ip);
    var replacement = latestCode();
    assertThat(replacement).isNotEqualTo(old);
    fails(ErrorCode.REGISTRATION_OTP_INVALID,
        () -> verification.verify(new VerifyRegistrationRequest(session.verificationSession(), old), ip));
    verification.verify(new VerifyRegistrationRequest(session.verificationSession(), replacement), ip);
  }

  @Test
  void perAccountSendLimitCannotBeBypassedByChangingEmailOrResuming() {
    var session = register();
    for (var send = 1; send < 10; send++) {
      verification.changeEmail(new ChangeRegistrationEmailRequest(session.verificationSession(), send + "-" + email), ip);
    }
    fails(ErrorCode.REGISTRATION_RATE_LIMITED,
        () -> verification.changeEmail(new ChangeRegistrationEmailRequest(session.verificationSession(), "blocked-" + email), ip));
    assertThat(users.findByEmailIgnoreCaseAndDeletedAtIsNull("9-" + email)).isPresent();
    assertThat(users.findByEmailIgnoreCaseAndDeletedAtIsNull("blocked-" + email)).isEmpty();
  }

  @Test
  void concurrentWrongAttemptsCannotLoseUpdatesOrExceedTheLimit() throws Exception {
    var session = register();
    var wrong = latestCode().equals("000000") ? "000001" : "000000";
    try (var pool = Executors.newFixedThreadPool(6)) {
      var tasks = IntStream.range(0, 6)
          .mapToObj(index -> pool.submit(() -> {
            try { verification.verify(new VerifyRegistrationRequest(session.verificationSession(), wrong), ip); }
            catch (ApiException error) { return error.getErrorCode(); }
            return null;
          })).toList();
      for (var result : tasks) assertThat(result.get(10, TimeUnit.SECONDS))
          .isIn(Set.of(ErrorCode.REGISTRATION_OTP_INVALID, ErrorCode.REGISTRATION_OTP_LOCKED));
    }
    var user = users.findByEmailIgnoreCaseAndDeletedAtIsNull(email).orElseThrow();
    assertThat(challenges.findByUserId(user.getId()).orElseThrow().getFailedAttempts()).isEqualTo(5);
  }

  @Test
  void sharedRateLimitSurvivesRejectedRequestsAndResetsAtWindowBoundary() {
    var key = "test:" + identifier;
    limits.consume(key, 2, Duration.ofMinutes(1));
    limits.consume(key, 2, Duration.ofMinutes(1));
    fails(ErrorCode.REGISTRATION_RATE_LIMITED, () -> limits.consume(key, 2, Duration.ofMinutes(1)));
    fails(ErrorCode.REGISTRATION_RATE_LIMITED, () -> limits.consume(key, 2, Duration.ofMinutes(1)));
    clock.advance(Duration.ofMinutes(1));
    limits.consume(key, 2, Duration.ofMinutes(1));
  }

  @Test
  void legacyLinksIssuedBeforeOtpMigrationStillActivatePendingAccounts() {
    var pending = users.save(User.builder().email(email).username(identifier).build());
    var legacy = emailTokens.issue(pending, AuthEmailTokenPurpose.EMAIL_VERIFICATION, Duration.ofHours(1), ip, "test");
    auth.verifyEmail(new VerifyEmailRequest(legacy.token()));
    assertThat(users.findById(pending.getId()).orElseThrow().getStatus()).isEqualTo(Status.ACTIVE);
  }

  @Test
  void legacyPendingRegistrationCanResumeByPasswordAndRevokesOldLink() {
    var pending = users.save(User.builder().email(email).username(identifier).fullName("Test Student")
        .passwordHash(passwordEncoder.encode(password)).build());
    var legacy = emailTokens.issue(pending, AuthEmailTokenPurpose.EMAIL_VERIFICATION, Duration.ofHours(1), ip, "test");
    var resumed = verification.resume(new LoginRequest(identifier, password), ip);
    var code = latestCode();
    fails(ErrorCode.EMAIL_TOKEN_INVALID, () -> auth.verifyEmail(new VerifyEmailRequest(legacy.token())));
    verification.verify(new VerifyRegistrationRequest(resumed.verificationSession(), code), ip);
    assertThat(users.findById(pending.getId()).orElseThrow().getStatus()).isEqualTo(Status.ACTIVE);
  }

  @Test
  void concurrentLegacyLinkAndPasswordRecoveryFinishWithoutLockOrderDeadlocks() throws Exception {
    var pending = users.save(User.builder().email(email).username(identifier).fullName("Test Student")
        .passwordHash(passwordEncoder.encode(password)).build());
    var legacy = emailTokens.issue(pending, AuthEmailTokenPurpose.EMAIL_VERIFICATION, Duration.ofHours(1), ip, "test");
    try (var pool = Executors.newFixedThreadPool(2)) {
      var recovered = pool.submit(() -> {
        try { verification.resume(new LoginRequest(identifier, password), ip); return "recovered"; }
        catch (ApiException error) { return error.getErrorCode().name(); }
      });
      var verified = pool.submit(() -> {
        try { auth.verifyEmail(new VerifyEmailRequest(legacy.token())); return "verified"; }
        catch (ApiException error) { return error.getErrorCode().name(); }
      });
      assertThat(recovered.get(10, TimeUnit.SECONDS)).isIn("recovered", "REGISTRATION_ALREADY_VERIFIED");
      assertThat(verified.get(10, TimeUnit.SECONDS)).isIn("verified", "EMAIL_TOKEN_INVALID");
    }
  }

  @Test
  void codesCannotBeUsedAgainstAnotherRegistrationSession() {
    var first = register();
    var code = latestCode();
    var another = auth.register(new RegisterRequest("second-" + email, "second-" + identifier, "Other Student", password),
        ip, "test").verification();
    var otherCode = latestCode();
    if (otherCode.equals(code)) {
      clock.advance(Duration.ofSeconds(60));
      verification.resend(new RegistrationSessionRequest(another.verificationSession()), ip);
    }
    fails(ErrorCode.REGISTRATION_OTP_INVALID,
        () -> verification.verify(new VerifyRegistrationRequest(another.verificationSession(), code), ip));
    verification.verify(new VerifyRegistrationRequest(first.verificationSession(), code), ip);
    assertThat(users.findByEmailIgnoreCaseAndDeletedAtIsNull("second-" + email).orElseThrow().getStatus()).isEqualTo(Status.PENDING);
  }

  @Test
  void passwordResetStillConsumesItsOwnPurposeAndRejectsVerificationTokens() {
    var session = register();
    verification.verify(new VerifyRegistrationRequest(session.verificationSession(), latestCode()), ip);
    var user = users.findByEmailIgnoreCaseAndDeletedAtIsNull(email).orElseThrow();
    var token = emailTokens.issue(user, AuthEmailTokenPurpose.PASSWORD_RESET, Duration.ofMinutes(15), ip, "test");
    fails(ErrorCode.EMAIL_TOKEN_INVALID, () -> auth.verifyEmail(new VerifyEmailRequest(token.token())));
    var replacementPassword = UUID.randomUUID().toString();
    auth.resetPassword(new ResetPasswordRequest(token.token(), replacementPassword));
    assertThat(passwordEncoder.matches(replacementPassword, users.findById(user.getId()).orElseThrow().getPasswordHash())).isTrue();
    fails(ErrorCode.EMAIL_TOKEN_INVALID,
        () -> auth.resetPassword(new ResetPasswordRequest(token.token(), replacementPassword)));
  }

  @TestConfiguration
  static class Dependencies {
    @Bean MutableClock clock() { return new MutableClock(); }
    @Bean SecureRandom random() { return new SecureRandom(); }
    @Bean PasswordEncoder passwordEncoder() { return PasswordEncoderFactories.createDelegatingPasswordEncoder(); }
    @Bean AuthProperties authProperties() { return new AuthProperties(null, null); }
    @Bean UserProperties userProperties() { return new UserProperties(null); }
    @Bean AuthMapper authMapper() { return Mappers.getMapper(AuthMapper.class); }
    @Bean AuthLinkBuilder authLinkBuilder() { return new AuthLinkBuilder(new ClientProperties("http://localhost")); }
    @Bean JdbcClient jdbcClient(DataSource source) { return JdbcClient.create(source); }
  }

  static class MutableClock extends Clock {
    volatile Instant instant = Instant.parse("2026-10-02T00:00:00Z");
    void advance(Duration amount) { instant = instant.plus(amount); }
    @Override public ZoneId getZone() { return ZoneOffset.UTC; }
    @Override public Clock withZone(ZoneId zone) { return this; }
    @Override public Instant instant() { return instant; }
  }
}
