package me.nghlong3004.olympic.user.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record AdminCreateUserResponse(
    @Schema(description = "Created user summary") UserResponse user,
    @Schema(example = "User created. Invite email sent.") String message) {}
