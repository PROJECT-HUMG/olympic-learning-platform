package me.nghlong3004.olympic.admin.response;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;
import me.nghlong3004.olympic.user.response.AvatarCropResponse;
import me.nghlong3004.olympic.user.enums.Permission;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/30/2026
 */
public record AdminUserResponse(
    UUID id,
    String email,
    String username,
    String fullName,
    String avatarUrl,
    AvatarCropResponse avatarCrop,
    Role role,
    Status status,
    Set<Permission> permissions,
    OffsetDateTime lastLoginAt,
    OffsetDateTime createdAt) {}
