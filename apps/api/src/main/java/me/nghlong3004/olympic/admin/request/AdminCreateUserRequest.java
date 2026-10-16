package me.nghlong3004.olympic.admin.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import me.nghlong3004.olympic.user.enums.Role;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/30/2026
 */
public record AdminCreateUserRequest(
    @Schema(description = "Work email address", example = "user@nghlong3004.me")
        @Size(max = 100)
        @Email(message = "Email must be valid")
        @NotBlank(message = "Email is required")
        String email,
    @NotBlank(message = "Username is required") @Size(min = 3, max = 100) String username,
    @Schema(description = "Full name shown in the workspace", example = "Nguyen Van A")
        @NotBlank(message = "Full name is required")
        @Size(max = 120, message = "Full name must be at most 120 characters")
        String fullName,
    @Schema(description = "Role user in website", example = "STUDENT") @NotNull Role role) {}
