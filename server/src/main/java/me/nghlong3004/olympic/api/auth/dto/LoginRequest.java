package me.nghlong3004.olympic.api.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for user login.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Schema(description = "User login request")
public record LoginRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Schema(description = "Login email", example = "student@humg.edu.vn")
        String email,

        @NotBlank(message = "Password is required")
        @Schema(description = "Login password")
        String password
) {}
