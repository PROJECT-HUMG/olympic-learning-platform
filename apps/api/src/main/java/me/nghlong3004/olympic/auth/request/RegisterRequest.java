package me.nghlong3004.olympic.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
public record RegisterRequest(
    @Schema(description = "Work email address", example = "user@nghlong3004.me")
        @Size(max = 100)
        @Email(message = "Email must be valid")
        @NotBlank(message = "Email is required")
        String email,
    @NotBlank(message = "Username is required") @Size(min = 3, max = 100) String username,
    @Schema(description = "Full name shown in the workspace", example = "Nguyen Van A")
        @NotBlank(message = "Full name is required")
        @Size(max = 120, message = "Full name must be at most 120 characters")
        String fullName,
    @Schema(description = "Initial password; never returned by the API", example = "ChangeMe@123")
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
        String password,
    @Schema(
            description =
                "Cloudflare Turnstile token. Optional while Turnstile is disabled. Maximum 2048 characters.",
            example = "turnstile-token")
        @Size(max = 2048, message = "Turnstile token must be at most 2048 characters")
        String turnstileToken) {

  public RegisterRequest(String email, String username, String fullName, String password) {
    this(email, username, fullName, password, null);
  }
}
