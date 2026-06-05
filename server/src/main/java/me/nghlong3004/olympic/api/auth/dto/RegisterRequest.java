package me.nghlong3004.olympic.api.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for user registration.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Schema(description = "User registration request")
public record RegisterRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Schema(description = "User email address", example = "student@humg.edu.vn")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 100, message = "Password must be 8-100 characters")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
                message = "Password must contain uppercase, lowercase, and digit"
        )
        @Schema(description = "Password (min 8 chars, must include upper/lower/digit)")
        String password,

        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 255, message = "Full name must be 2-255 characters")
        @Schema(description = "User full name", example = "Nguyễn Văn A")
        String fullName,

        @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "Invalid Vietnamese phone number")
        @Schema(description = "Vietnamese phone number", example = "0901234567")
        String phone,

        @Size(max = 50, message = "Student code must not exceed 50 characters")
        @Schema(description = "HUMG student code", example = "DH2024001")
        String studentCode
) {}
