package me.nghlong3004.olympic.auth.service.impl;

import static me.nghlong3004.olympic.common.constant.MessageConstant.EMAIL_VERIFIED_MESSAGE;
import static me.nghlong3004.olympic.common.constant.MessageConstant.EMAIL_VERIFIED_MESSAGE_KEY;

import jakarta.persistence.EntityManager;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.auth.entity.AuthRegistrationChallenge;
import me.nghlong3004.olympic.auth.repository.AuthRegistrationChallengeRepository;
import me.nghlong3004.olympic.auth.request.ChangeRegistrationEmailRequest;
import me.nghlong3004.olympic.auth.request.LoginRequest;
import me.nghlong3004.olympic.auth.request.RegistrationSessionRequest;
import me.nghlong3004.olympic.auth.request.VerifyRegistrationRequest;
import me.nghlong3004.olympic.auth.response.AuthMessageResponse;
import me.nghlong3004.olympic.auth.response.RegistrationChallengeResponse;
import me.nghlong3004.olympic.auth.service.AuthEmailTokenService;
import me.nghlong3004.olympic.auth.service.RegistrationRateLimitService;
import me.nghlong3004.olympic.auth.service.RegistrationVerificationService;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.mail.event.MailSendEvent;
import me.nghlong3004.olympic.common.mail.model.RegistrationOtpMailModel;
import me.nghlong3004.olympic.common.util.AuthLinkBuilder;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RegistrationVerificationServiceImpl implements RegistrationVerificationService {
  private static final Duration CODE_TTL = Duration.ofMinutes(10);
  private static final Duration SESSION_TTL = Duration.ofHours(1);
  private static final Duration COOLDOWN = Duration.ofSeconds(60);
  private static final Duration RATE_WINDOW = Duration.ofHours(1);
  private static final int MAX_ATTEMPTS = 5;

  private final AuthRegistrationChallengeRepository challenges;
  private final UserRepository users;
  private final EntityManager entityManager;
  private final AuthEmailTokenService emailTokens;
  private final RegistrationRateLimitService limits;
  private final PasswordEncoder passwordEncoder;
  private final ApplicationEventPublisher events;
  private final SecureRandom random;
  private final Clock clock;

  @Transactional
  @Override
  public RegistrationChallengeResponse start(User user, String ip) {
    limits.consume("register:" + ip, 10, RATE_WINDOW);
    requirePending(user);
    return issue(user, new AuthRegistrationChallenge(), sessionToken(), ip, true);
  }

  @Transactional
  @Override
  public RegistrationChallengeResponse resume(LoginRequest request, String ip) {
    limits.consume("resume-ip:" + ip, 20, RATE_WINDOW);
    var identifier = request.identifier().trim();
    limits.consume("resume-account:" + identifier.toLowerCase(Locale.ROOT), 10, RATE_WINDOW);
    var candidate = (identifier.contains("@")
        ? users.findByEmailIgnoreCaseAndDeletedAtIsNull(AuthLinkBuilder.normalizeEmail(identifier))
        : users.findByUsernameIgnoreCaseAndDeletedAtIsNull(identifier))
        .orElseThrow(ErrorCode.INVALID_CREDENTIALS::throwIt);
    if (candidate.getPasswordHash() == null ||
        !passwordEncoder.matches(request.password(), candidate.getPasswordHash())) {
      throw ErrorCode.INVALID_CREDENTIALS.throwIt();
    }
    var user = users.findForUpdateById(candidate.getId()).orElseThrow(ErrorCode.INVALID_CREDENTIALS::throwIt);
    entityManager.refresh(user);
    if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw ErrorCode.INVALID_CREDENTIALS.throwIt();
    }
    requirePending(user);
    var challenge = challenges.findByUserId(user.getId()).orElseGet(AuthRegistrationChallenge::new);
    requireCooldown(challenge);
    return issue(user, challenge, sessionToken(), ip, true);
  }

  @Transactional
  @Override
  public RegistrationChallengeResponse resend(RegistrationSessionRequest request, String ip) {
    var user = sessionUser(request.verificationSession());
    requirePending(user);
    var challenge = challenge(user, request.verificationSession());
    requireCooldown(challenge);
    return issue(user, challenge, request.verificationSession(), ip, false);
  }

  @Transactional
  @Override
  public RegistrationChallengeResponse changeEmail(ChangeRegistrationEmailRequest request, String ip) {
    var user = sessionUser(request.verificationSession());
    requirePending(user);
    var challenge = challenge(user, request.verificationSession());
    var email = AuthLinkBuilder.normalizeEmail(request.email());
    if (user.getEmail().equalsIgnoreCase(email)) {
      requireCooldown(challenge);
    } else {
      if (users.existsByEmailIgnoreCaseAndDeletedAtIsNull(email)) {
        throw ErrorCode.DUPLICATE_RESOURCE.throwIt();
      }
      user.setEmail(email);
    }
    return issue(user, challenge, request.verificationSession(), ip, false);
  }

  // Invalid-code attempts must commit even though the response is an API error.
  @Transactional(noRollbackFor = ApiException.class)
  @Override
  public AuthMessageResponse verify(VerifyRegistrationRequest request, String ip) {
    limits.consume("verify-ip:" + ip, 60, Duration.ofMinutes(10));
    var user = sessionUser(request.verificationSession());
    user.requireNotDisabled();
    var challenge = challenge(user, request.verificationSession());
    if (user.getStatus() == Status.ACTIVE) return verified();
    if (!challenge.getEmail().equals(user.getEmail())) throw ErrorCode.REGISTRATION_SESSION_INVALID.throwIt();
    if (challenge.getFailedAttempts() >= MAX_ATTEMPTS) throw ErrorCode.REGISTRATION_OTP_LOCKED.throwIt();
    if (!challenge.getExpiresAt().isAfter(OffsetDateTime.now(clock))) {
      throw ErrorCode.REGISTRATION_OTP_EXPIRED.throwIt();
    }
    var actual = hash(request.verificationSession() + ":" + request.code());
    if (!MessageDigest.isEqual(actual.getBytes(StandardCharsets.UTF_8),
        challenge.getCodeHash().getBytes(StandardCharsets.UTF_8))) {
      challenge.setFailedAttempts(challenge.getFailedAttempts() + 1);
      if (challenge.getFailedAttempts() >= MAX_ATTEMPTS) throw ErrorCode.REGISTRATION_OTP_LOCKED.throwIt();
      throw ErrorCode.REGISTRATION_OTP_INVALID.throwIt();
    }
    user.setStatus(Status.ACTIVE);
    user.setUpdatedAt(OffsetDateTime.now(clock));
    challenge.setVerifiedAt(OffsetDateTime.now(clock));
    emailTokens.revokeActiveForUser(user.getId());
    log.info("Registration email verified: userId={}", user.getId());
    return verified();
  }

  private User sessionUser(String rawSession) {
    if (rawSession == null || !rawSession.matches("[A-Za-z0-9_-]{64}")) {
      throw ErrorCode.REGISTRATION_SESSION_INVALID.throwIt();
    }
    var userId = challenges.findUserIdBySessionHash(hash(rawSession))
        .orElseThrow(ErrorCode.REGISTRATION_SESSION_INVALID::throwIt);
    // All registration operations lock user first, then read challenge, to serialize resends,
    // email corrections, session rotations and verification across API instances.
    return users.findForUpdateById(userId).orElseThrow(ErrorCode.REGISTRATION_SESSION_INVALID::throwIt);
  }

  private AuthRegistrationChallenge challenge(User user, String rawSession) {
    var challenge = challenges.findByUserId(user.getId())
        .orElseThrow(ErrorCode.REGISTRATION_SESSION_INVALID::throwIt);
    if (!challenge.getSessionHash().equals(hash(rawSession)) ||
        !challenge.getSessionExpiresAt().isAfter(OffsetDateTime.now(clock))) {
      throw ErrorCode.REGISTRATION_SESSION_INVALID.throwIt();
    }
    return challenge;
  }

  private RegistrationChallengeResponse issue(User user, AuthRegistrationChallenge challenge,
      String rawSession, String ip, boolean renewSession) {
    limits.consume("send-ip:" + ip, 30, RATE_WINDOW);
    limits.consume("send-user:" + user.getId(), 10, RATE_WINDOW);
    var now = OffsetDateTime.now(clock);
    String code;
    String digest;
    do {
      code = String.format(Locale.ROOT, "%06d", random.nextInt(1_000_000));
      // The random session is a secret salt absent from the database. A database leak cannot
      // enumerate the six-digit code from its digest alone. Online guesses remain capped at five.
      digest = hash(rawSession + ":" + code);
    } while (digest.equals(challenge.getCodeHash()));
    challenge.setUserId(user.getId());
    challenge.setSessionHash(hash(rawSession));
    challenge.setCodeHash(digest);
    challenge.setEmail(user.getEmail());
    challenge.setExpiresAt(now.plus(CODE_TTL));
    challenge.setResendAvailableAt(now.plus(COOLDOWN));
    if (renewSession) challenge.setSessionExpiresAt(now.plus(SESSION_TTL));
    challenge.setFailedAttempts(0);
    challenge.setVerifiedAt(null);
    challenges.save(challenge);
    emailTokens.revokeActiveForUser(user.getId());
    events.publishEvent(new MailSendEvent(new RegistrationOtpMailModel(user.getEmail(), user.getFullName(), code)));
    log.info("Registration verification code requested: userId={}", user.getId());
    return new RegistrationChallengeResponse(rawSession, user.getEmail(), challenge.getExpiresAt(),
        challenge.getResendAvailableAt(), challenge.getSessionExpiresAt());
  }

  private void requirePending(User user) {
    user.requireNotDisabled();
    if (user.getStatus() != Status.PENDING) throw ErrorCode.REGISTRATION_ALREADY_VERIFIED.throwIt();
  }

  private void requireCooldown(AuthRegistrationChallenge challenge) {
    if (challenge.getResendAvailableAt() != null &&
        challenge.getResendAvailableAt().isAfter(OffsetDateTime.now(clock))) {
      throw ErrorCode.REGISTRATION_COOLDOWN.throwIt();
    }
  }

  private String sessionToken() {
    var bytes = new byte[48];
    random.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private String hash(String value) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
          .digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 is unavailable", exception);
    }
  }

  private AuthMessageResponse verified() {
    return new AuthMessageResponse(EMAIL_VERIFIED_MESSAGE, EMAIL_VERIFIED_MESSAGE_KEY);
  }
}
