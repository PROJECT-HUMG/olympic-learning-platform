package me.nghlong3004.olympic.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for user login.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
) {}
