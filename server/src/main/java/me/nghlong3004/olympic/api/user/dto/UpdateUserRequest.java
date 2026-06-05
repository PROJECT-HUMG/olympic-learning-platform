package me.nghlong3004.olympic.api.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating user profile.
 *
 * <p>All fields are optional — only non-null fields are applied.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Schema(description = "Update user request (partial update)")
public record UpdateUserRequest(
        @Email(message = "Invalid email format")
        @Schema(description = "New email (optional)")
        String email,

        @Size(min = 2, max = 255, message = "Full name must be 2-255 characters")
        @Schema(description = "New full name (optional)")
        String fullName,

        @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "Invalid Vietnamese phone number")
        @Schema(description = "New phone (optional)")
        String phone,

        @Size(max = 500, message = "Avatar URL must not exceed 500 characters")
        @Schema(description = "Avatar URL (optional)")
        String avatarUrl,

        @Size(max = 50, message = "Student code must not exceed 50 characters")
        @Schema(description = "Student code (optional)")
        String studentCode
) {}
