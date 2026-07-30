package me.nghlong3004.olympic.admin.response;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;
import me.nghlong3004.olympic.user.enums.Permission;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.entity.User;

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
    Role role,
    Status status,
    Set<Permission> permissions,
    OffsetDateTime lastLoginAt,
    OffsetDateTime createdAt) {

  public static AdminUserResponse fromEntity(User user, String avatarUrl) {
    return new AdminUserResponse(
        user.getId(),
        user.getEmail(),
        user.getUsername(),
        user.getFullName(),
        avatarUrl,
        user.getRole(),
        user.getStatus(),
        user.getPermissions(),
        user.getLastLoginAt(),
        user.getCreatedAt());
  }
}
