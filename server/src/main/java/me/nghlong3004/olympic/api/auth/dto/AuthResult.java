package me.nghlong3004.olympic.api.auth.dto;

import java.time.Instant;

/**
 * Internal result record used between AuthService and AuthController.
 *
 * <p>Contains both the API response and the refresh token details
 * so the controller can set the HttpOnly cookie separately.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public record AuthResult(
        AuthResponse response,
        String refreshToken,
        Instant refreshExpiresAt
) {}
