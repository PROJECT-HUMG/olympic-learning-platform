package me.nghlong3004.olympic.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
public record ResetPasswordRequest(
    @Schema(description = "One-time password reset or invite token")
        @NotBlank(message = "Token is required")
        String token,
    @Schema(description = "New password; never returned by the API", example = "NewPassword@123")
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
        String password) {}
