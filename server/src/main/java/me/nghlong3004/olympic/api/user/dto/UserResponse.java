package me.nghlong3004.olympic.api.user.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for user information.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public record UserResponse(
        UUID id,
        String email,
        String fullName,
        String phone,
        String avatarUrl,
        String studentCode,
        String role,
        boolean enabled,
        boolean emailVerified,
        Instant createdAt
) {}
