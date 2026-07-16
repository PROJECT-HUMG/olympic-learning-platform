package me.nghlong3004.olympic.auth.service.impl;

import static me.nghlong3004.olympic.common.config.JwtConfig.*;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.auth.service.TokenService;
import me.nghlong3004.olympic.common.config.SecurityProperties;
import me.nghlong3004.olympic.user.entity.User;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JwtTokenServiceImpl implements TokenService {
  private final JwtEncoder jwtEncoder;
  private final SecurityProperties properties;
  private final Clock clock;

  @Override
  public String issueAccessToken(User user) {
    var now = Instant.now(clock);
    var expiresAt = now.plus(accessTokenDuration());

    var claims =
        JwtClaimsSet.builder()
            .issuer(ISSUER)
            .issuedAt(now)
            .expiresAt(expiresAt)
            .subject(user.getId().toString())
            .claim(EMAIL_CLAIM, user.getEmail())
            .claim(USERNAME_CLAIM, user.getUsername())
            .claim(FULL_NAME_CLAIM, user.getFullName())
            .claim(ROLE_CLAIM, user.getRole().name())
            .claim(STATUS_CLAIM, user.getStatus().name())
            .build();

    var header = JwsHeader.with(MacAlgorithm.HS256).build();

    var token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();

    log.debug("Access token issued: userId={} expiresAt={}", user.getId(), expiresAt);

    return token;
  }

  @Override
  public long accessExpiresInSeconds() {
    return accessTokenDuration().toSeconds();
  }

  private Duration accessTokenDuration() {
    return Duration.ofMinutes(properties.accessExpirationMinutes());
  }
}
