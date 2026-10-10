package me.nghlong3004.olympic.user.response;

import java.util.UUID;
import me.nghlong3004.olympic.user.entity.User;

/**
 * Minimal identity for public attribution, never account/security or login data.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/10/2026
 */
public record PublicUserIdentityResponse(UUID id, String fullName, String username,
    String avatarUrl, AvatarCropResponse avatarCrop, boolean profileAvailable) {
  public static PublicUserIdentityResponse fromUser(User user) {
    boolean available = user.active() && user.getDeletedAt() == null;
    return new PublicUserIdentityResponse(user.getId(), user.getFullName(),
        available ? user.getUsername() : null, null,
        available ? AvatarCropResponse.fromEntity(user.getAvatarCrop()) : null, available);
  }

  public PublicUserIdentityResponse withAvatarUrl(String url) {
    return new PublicUserIdentityResponse(id, fullName, username,
        profileAvailable ? url : null, avatarCrop, profileAvailable);
  }
}
