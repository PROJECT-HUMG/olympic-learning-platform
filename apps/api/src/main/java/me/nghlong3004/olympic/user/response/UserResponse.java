package me.nghlong3004.olympic.user.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.UUID;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
@Schema(name = "UserResponse", description = "Public user payload")
public record UserResponse(
    @Schema(
            description = "Id user identifier. Internal numeric ids are never exposed.",
            example = "7b7b7d42-5f42-4c5a-9281-8d1d36f6f59d")
        UUID id,
    @Schema(description = "User email address.", example = "nghlong3004@gmail.com") String email,
    @Schema(description = "Username.", example = "nghlong3004") String username,
    @Schema(description = "User display name.", example = "Nguyen Hoang Long") String fullName,
    @Schema(
            description = "User avatar URL.",
            example = "https://ui-avatars.com/api/?name=Nguyen+Hoang+Long",
            nullable = true)
        String avatarUrl,
    @Schema(description = "Application role.", example = "STUDENT") Role role,
    @Schema(description = "User account status.", example = "ACTIVE") Status status,
    @Schema(
            description = "Last successful login time.",
            example = "2026-06-09T10:00:00Z",
            nullable = true)
        OffsetDateTime lastLoginAt) {}
