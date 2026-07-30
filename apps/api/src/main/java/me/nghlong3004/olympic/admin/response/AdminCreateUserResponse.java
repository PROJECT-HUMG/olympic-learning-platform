package me.nghlong3004.olympic.admin.response;

import io.swagger.v3.oas.annotations.media.Schema;
import me.nghlong3004.olympic.user.response.UserResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/30/2026
 */
public record AdminCreateUserResponse(
    @Schema(description = "Created user summary") UserResponse user,
    @Schema(example = "User created. Invite email sent.") String message) {}
