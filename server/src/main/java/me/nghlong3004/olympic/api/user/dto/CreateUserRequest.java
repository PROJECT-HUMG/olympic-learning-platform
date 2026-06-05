package me.nghlong3004.olympic.api.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request DTO for creating a new user (admin action).
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotBlank String fullName,
        String phone,
        String studentCode,
        @NotNull UUID roleId
) {}
