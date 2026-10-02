package me.nghlong3004.olympic.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
public record RegistrationChallengeResponse(
    @Schema(description = "Secret registration session; do not put in URLs or logs") String verificationSession,
    String email,
    OffsetDateTime expiresAt,
    OffsetDateTime resendAvailableAt,
    OffsetDateTime sessionExpiresAt) {}
