package me.nghlong3004.olympic.group.service;

import java.util.UUID;
import me.nghlong3004.olympic.group.dto.GroupAvatarBytes;
import me.nghlong3004.olympic.group.request.UpdateGroupAvatarCropRequest;
import me.nghlong3004.olympic.group.response.GroupAvatarResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public interface GroupAvatarService {
  /**
   * Saves an original raster and framing; active founder only, no public storage effects.
   * @param groupId target group
   * @param image bounded JPEG, PNG or WebP
   * @param crop profile-compatible framing
   * @return current image metadata
   */
  GroupAvatarResponse upload(UUID groupId, MultipartFile image, UpdateGroupAvatarCropRequest crop);

  /**
   * Updates framing without uploading bytes; rejects an obsolete image identifier.
   * @param groupId founder's group
   * @param avatarId expected current image
   * @param crop framing
   * @return saved metadata
   */
  GroupAvatarResponse crop(UUID groupId, UUID avatarId, UpdateGroupAvatarCropRequest crop);

  /**
   * Removes only the current group image, never members or personal plans.
   * @param groupId founder's group
   * @param avatarId expected image, avoiding deletion of a concurrent replacement
   */
  void remove(UUID groupId, UUID avatarId);

  /**
   * Rechecks live membership on each private original-byte read.
   * @param groupId member's group
   * @param avatarId current image identifier
   * @return original bytes and detected raster type
   */
  GroupAvatarBytes read(UUID groupId, UUID avatarId);
}
