package me.nghlong3004.olympic.api.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for refreshing access token.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public record RefreshTokenRequest(
        @NotBlank String refreshToken
) {}
