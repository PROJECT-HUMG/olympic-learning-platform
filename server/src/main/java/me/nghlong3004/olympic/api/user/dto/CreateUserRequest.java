package me.nghlong3004.olympic.api.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Request DTO for creating a new user (admin action).
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Schema(description = "Create user request (admin)")
public record CreateUserRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Schema(description = "User email", example = "user@humg.edu.vn")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 100, message = "Password must be 8-100 characters")
        @Schema(description = "Initial password")
        String password,

        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 255, message = "Full name must be 2-255 characters")
        @Schema(description = "Full name", example = "Trần Văn B")
        String fullName,

        @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "Invalid Vietnamese phone number")
        @Schema(description = "Phone number", example = "0909876543")
        String phone,

        @Size(max = 50, message = "Student code must not exceed 50 characters")
        @Schema(description = "Student code", example = "DH2024002")
        String studentCode,

        @NotNull(message = "Role ID is required")
        @Schema(description = "UUID of the role to assign")
        UUID roleId
) {}
