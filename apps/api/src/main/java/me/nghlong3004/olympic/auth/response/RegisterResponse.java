package me.nghlong3004.olympic.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;
import me.nghlong3004.olympic.user.enums.Status;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
public record RegisterResponse(
    @Schema(description = "Created user id") UUID id,
    @Schema(description = "Created user email", example = "user@nghlong3004.me") String email,
    @Schema(description = "Created username", example = "nghlong3004") String username,
    @Schema(description = "Current user status") Status status,
    @Schema(example = "Registration accepted. Verify your email to activate the account.")
        String message) {}
