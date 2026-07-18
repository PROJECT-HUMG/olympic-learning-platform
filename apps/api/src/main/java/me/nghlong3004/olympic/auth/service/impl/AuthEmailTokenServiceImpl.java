package me.nghlong3004.olympic.auth.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.auth.dto.AuthEmailTokenConsumption;
import me.nghlong3004.olympic.auth.dto.AuthEmailTokenIssue;
import me.nghlong3004.olympic.auth.entity.AuthEmailToken;
import me.nghlong3004.olympic.auth.enums.AuthEmailTokenPurpose;
import me.nghlong3004.olympic.auth.enums.AuthEmailTokenStatus;
import me.nghlong3004.olympic.auth.repository.AuthEmailTokenRepository;
import me.nghlong3004.olympic.auth.service.AuthEmailTokenService;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
@Service
@RequiredArgsConstructor
public class AuthEmailTokenServiceImpl implements AuthEmailTokenService {

  private final AuthEmailTokenRepository repository;
  private final UserRepository userRepository;
  private final Clock clock;
  private final SecureRandom random;

  @Transactional
  @Override
  public AuthEmailTokenIssue issue(
      User user, AuthEmailTokenPurpose purpose, Duration ttl, String ip, String userAgent) {

    userRepository
        .findForUpdateById(user.getId())
        .orElseThrow(ErrorCode.EMAIL_TOKEN_INVALID::throwIt);

    revokeActive(user.getId(), Set.of(purpose));
    var rawToken = randomToken();
    var now = OffsetDateTime.now(clock);
    var expiresAt = now.plus(ttl);
    repository.save(
        AuthEmailToken.builder()
            .userId(user.getId())
            .tokenHash(hash(rawToken))
            .purpose(purpose)
            .status(AuthEmailTokenStatus.ACTIVE)
            .issuedAt(now)
            .expiresAt(expiresAt)
            .createdIp(ip)
            .userAgent(userAgent)
            .build());
    return new AuthEmailTokenIssue(rawToken, expiresAt);
  }

  @Transactional
  @Override
  public User consume(String rawToken, Set<AuthEmailTokenPurpose> allowedPurposes) {
    return consumeWithPurpose(rawToken, allowedPurposes).user();
  }

  @Transactional
  @Override
  public AuthEmailTokenConsumption consumeWithPurpose(
      String rawToken, Set<AuthEmailTokenPurpose> allowedPurposes) {
    if (rawToken == null || rawToken.isBlank()) {
      throw ErrorCode.EMAIL_TOKEN_MISSING.throwIt();
    }
    var now = OffsetDateTime.now(clock);
    var token =
        repository
            .findForUpdateByTokenHashAndStatus(hash(rawToken), AuthEmailTokenStatus.ACTIVE)
            .orElseThrow(ErrorCode.EMAIL_TOKEN_INVALID::throwIt);
    if (!allowedPurposes.contains(token.getPurpose())) {
      throw ErrorCode.EMAIL_TOKEN_INVALID.throwIt();
    }
    if (!token.getExpiresAt().isAfter(now)) {
      token.setStatus(AuthEmailTokenStatus.EXPIRED);
      throw ErrorCode.EMAIL_TOKEN_EXPIRED.throwIt();
    }
    token.setStatus(AuthEmailTokenStatus.USED);
    token.setUsedAt(now);
    var user =
        userRepository
            .findByIdAndDeletedAtIsNull(token.getUserId())
            .orElseThrow(ErrorCode.EMAIL_TOKEN_INVALID::throwIt);
    return new AuthEmailTokenConsumption(user, token.getPurpose());
  }

  @Transactional
  @Override
  public void revokeActiveForUser(UUID userId) {
    repository.revokeAllByUserIdAndStatus(
        userId,
        AuthEmailTokenStatus.ACTIVE,
        AuthEmailTokenStatus.REVOKED,
        OffsetDateTime.now(clock));
  }

  private void revokeActive(UUID userId, Set<AuthEmailTokenPurpose> purposes) {
    repository.revokeAllByUserIdAndPurposesAndStatus(
        userId,
        purposes,
        AuthEmailTokenStatus.ACTIVE,
        AuthEmailTokenStatus.REVOKED,
        OffsetDateTime.now(clock));
  }

  private String randomToken() {
    var bytes = new byte[48];
    random.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private String hash(String token) {
    try {
      var digest = MessageDigest.getInstance("SHA-256");
      var bytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 is unavailable", exception);
    }
  }
}
