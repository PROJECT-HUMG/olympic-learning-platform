package me.nghlong3004.olympic.api.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for user information.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Schema(description = "User profile information")
public record UserResponse(
        @Schema(description = "User public UUID") UUID id,
        @Schema(description = "Email address") String email,
        @Schema(description = "Full name") String fullName,
        @Schema(description = "Phone number") String phone,
        @Schema(description = "Avatar URL") String avatarUrl,
        @Schema(description = "Student code") String studentCode,
        @Schema(description = "Assigned role name") String role,
        @Schema(description = "Account enabled") boolean enabled,
        @Schema(description = "Email verified") boolean emailVerified,
        @Schema(description = "Account creation time") Instant createdAt
) {}
