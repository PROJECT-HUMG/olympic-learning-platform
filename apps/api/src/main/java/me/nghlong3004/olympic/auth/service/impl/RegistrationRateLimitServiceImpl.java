package me.nghlong3004.olympic.auth.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.auth.service.RegistrationRateLimitService;
import me.nghlong3004.olympic.common.error.ErrorCode;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@Service
@RequiredArgsConstructor
public class RegistrationRateLimitServiceImpl implements RegistrationRateLimitService {
  private final JdbcClient jdbc;
  private final Clock clock;

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  @Override
  public void consume(String key, int maximum, Duration window) {
    var now = OffsetDateTime.now(clock);
    var hits = jdbc.sql("""
       INSERT INTO auth_registration_rate_limits (bucket_key, hits, expires_at)
       VALUES (:key, 1, :expires)
       ON CONFLICT (bucket_key) DO UPDATE SET
         hits = CASE WHEN auth_registration_rate_limits.expires_at <= :now
           THEN 1 ELSE auth_registration_rate_limits.hits + 1 END,
         expires_at = CASE WHEN auth_registration_rate_limits.expires_at <= :now
           THEN :expires ELSE auth_registration_rate_limits.expires_at END
       RETURNING hits
       """).param("key", hash(key)).param("now", now).param("expires", now.plus(window))
       .query(Integer.class).single();
    if (hits > maximum) throw ErrorCode.REGISTRATION_RATE_LIMITED.throwIt();
  }

  @Scheduled(fixedDelay = 3600000, initialDelay = 3600000)
  public void removeExpiredBuckets() {
    jdbc.sql("DELETE FROM auth_registration_rate_limits WHERE expires_at < :cutoff")
        .param("cutoff", OffsetDateTime.now(clock).minusDays(1)).update();
  }

  private String hash(String value) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
          .digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 is unavailable", exception);
    }
  }
}
