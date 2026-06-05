package me.nghlong3004.olympic.api.user.dto;

import jakarta.validation.constraints.Email;

/**
 * Request DTO for updating user profile.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public record UpdateUserRequest(
        @Email String email,
        String fullName,
        String phone,
        String avatarUrl,
        String studentCode
) {}
