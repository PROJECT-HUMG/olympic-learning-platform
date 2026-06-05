package me.nghlong3004.olympic.api.auth.service;

import me.nghlong3004.olympic.api.user.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/**
 * Service for creating and managing JWT access tokens.
 *
 * <p>Uses {@link JwtEncoder} configured in {@code JwtConfig} with HS256 signing.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Service
public class JwtTokenService {

    private final JwtEncoder jwtEncoder;
    private final long accessExpirationMinutes;
    private final long refreshExpirationMinutes;

    public JwtTokenService(
            JwtEncoder jwtEncoder,
            @Value("${olympic.security.jwt.access-expiration:15}") long accessExpirationMinutes,
            @Value("${olympic.security.jwt.refresh-expiration:10080}") long refreshExpirationMinutes) {
        this.jwtEncoder = Objects.requireNonNull(jwtEncoder, "jwtEncoder must not be null");
        this.accessExpirationMinutes = accessExpirationMinutes;
        this.refreshExpirationMinutes = refreshExpirationMinutes;
    }

    /**
     * Creates a signed JWT access token for the given user.
     *
     * @param user the authenticated user
     * @return signed JWT string
     */
    public String createAccessToken(User user) {
        Objects.requireNonNull(user, "user must not be null");

        Instant now = Instant.now();
        Instant expiresAt = now.plus(accessExpirationMinutes, ChronoUnit.MINUTES);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("olympic-api")
                .subject(user.getPublicId().toString())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim("role", user.getRole().getName())
                .claim("email", user.getEmail())
                .claim("name", user.getFullName())
                .build();

        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    /**
     * Returns the expiration instant for a new access token.
     */
    public Instant getAccessTokenExpiration() {
        return Instant.now().plus(accessExpirationMinutes, ChronoUnit.MINUTES);
    }

    /**
     * Returns the expiration instant for a new refresh token.
     */
    public Instant getRefreshTokenExpiration() {
        return Instant.now().plus(refreshExpirationMinutes, ChronoUnit.MINUTES);
    }
}
