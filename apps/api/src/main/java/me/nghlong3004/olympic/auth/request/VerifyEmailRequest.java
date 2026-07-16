package me.nghlong3004.olympic.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
public record VerifyEmailRequest(
    @Schema(description = "One-time email verification token")
        @NotBlank(message = "Token is required")
        String token) {}
