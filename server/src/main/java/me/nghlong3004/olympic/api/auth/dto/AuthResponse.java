package me.nghlong3004.olympic.api.auth.dto;

import java.time.Instant;

/**
 * Response DTO for authentication (login/register/refresh).
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        Instant expiresAt
) {
    public static AuthResponse of(String accessToken, String refreshToken, Instant expiresAt) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", expiresAt);
    }
}
