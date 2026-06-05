package me.nghlong3004.olympic.api.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

/**
 * Response DTO for authentication (login/register/refresh).
 *
 * <p>Only contains the access token. The refresh token is delivered
 * via an HttpOnly secure cookie for XSS protection.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Schema(description = "Authentication response with access token")
public record AuthResponse(
        @Schema(description = "JWT access token", example = "eyJhbGciOiJIUzI1NiJ9...")
        String accessToken,

        @Schema(description = "Token type", example = "Bearer")
        String tokenType,

        @Schema(description = "Access token expiration time")
        Instant expiresAt
) {
    public static AuthResponse bearer(String accessToken, Instant expiresAt) {
        return new AuthResponse(accessToken, "Bearer", expiresAt);
    }
}
