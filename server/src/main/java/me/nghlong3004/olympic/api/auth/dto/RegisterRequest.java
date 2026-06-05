package me.nghlong3004.olympic.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for user registration.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, max = 100) String password,
        @NotBlank String fullName,
        String phone,
        String studentCode
) {}
