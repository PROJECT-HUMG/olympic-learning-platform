package me.nghlong3004.olympic.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
public record RegistrationSessionRequest(
    @Schema(description = "Opaque registration session; never an access token")
    @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{64}") String verificationSession) {}
