package me.nghlong3004.olympic.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
public record ForgotPasswordRequest(
    @Schema(description = "Account email address", example = "user@nghlong3004.me")
        @Email(message = "Email must be valid")
        @NotBlank(message = "Email is required")
        String email) {}
