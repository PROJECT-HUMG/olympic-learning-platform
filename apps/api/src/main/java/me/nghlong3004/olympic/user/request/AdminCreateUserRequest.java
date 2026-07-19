package me.nghlong3004.olympic.user.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import me.nghlong3004.olympic.user.enums.Role;

public record AdminCreateUserRequest(
    @Schema(description = "Work email address", example = "user@nghlong3004.me")
        @Email(message = "Email must be valid")
        @NotBlank(message = "Email is required")
        String email,
    @NotBlank(message = "Username is required") String username,
    @Schema(description = "Full name shown in the workspace", example = "Nguyen Van A")
        @NotBlank(message = "Full name is required")
        @Size(max = 120, message = "Full name must be at most 120 characters")
        String fullName,
    @Schema(description = "Role user in website", example = "STUDENT, LECTURER") @NotBlank
        Role role,
    @Schema(description = "Initial password; never returned by the API", example = "ChangeMe@123")
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
        String password) {}
