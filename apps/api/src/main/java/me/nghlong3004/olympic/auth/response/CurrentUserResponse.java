package me.nghlong3004.olympic.auth.response;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;
import me.nghlong3004.olympic.user.enums.Permission;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.response.AvatarCropResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
public record CurrentUserResponse(
    UUID id,
    String email,
    String username,
    String fullName,
    String avatarUrl,
    AvatarCropResponse avatarCrop,
    Role role,
    Status status,
    OffsetDateTime lastLoginAt,
    Set<Permission> permissions) {

  public CurrentUserResponse {
    permissions = permissions == null ? Set.of() : Set.copyOf(permissions);
  }

  /** Returns a copy of this response with the given avatar URL. */
  public CurrentUserResponse withAvatarUrl(String avatarUrl) {
    return new CurrentUserResponse(
        id,
        email,
        username,
        fullName,
        avatarUrl,
        avatarCrop,
        role,
        status,
        lastLoginAt,
        permissions);
  }
}
