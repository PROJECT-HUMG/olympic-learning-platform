package me.nghlong3004.olympic.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload for changing password of the currently authenticated user.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
@Schema(name = "ChangePasswordRequest", description = "Authenticated password change payload")
public record ChangePasswordRequest(
    @Schema(description = "Current password of the user", example = "OldPass123!")
        @NotBlank(message = "Current password is required")
        String currentPassword,
    @Schema(description = "New password to set", example = "NewPass123!")
        @NotBlank(message = "New password is required")
        @Size(min = 6, max = 100, message = "New password must be between 6 and 100 characters")
        String newPassword) {}
