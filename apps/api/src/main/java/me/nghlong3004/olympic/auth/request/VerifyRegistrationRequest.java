package me.nghlong3004.olympic.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
public record VerifyRegistrationRequest(
    @Schema(description = "Opaque registration session")
    @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{64}") String verificationSession,
    @Schema(description = "Six digit code from the email", example = "012345")
    @NotBlank @Pattern(regexp = "[0-9]{6}", message = "Code must contain six digits") String code) {}
