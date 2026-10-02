package me.nghlong3004.olympic.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
public record ChangeRegistrationEmailRequest(
    @Schema(description = "Opaque registration session authorizing the pending account only")
    @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{64}") String verificationSession,
    @NotBlank @Email @Size(max = 100) String email) {}
