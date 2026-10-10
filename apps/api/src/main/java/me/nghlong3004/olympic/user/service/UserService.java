package me.nghlong3004.olympic.user.service;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
import java.util.UUID;
import java.util.Collection;
import java.util.Map;
import me.nghlong3004.olympic.user.response.PublicUserIdentityResponse;
import me.nghlong3004.olympic.auth.response.CurrentUserResponse;
import me.nghlong3004.olympic.user.request.UpdateProfileRequest;
import me.nghlong3004.olympic.user.request.UpdateAvatarCropRequest;
import me.nghlong3004.olympic.user.response.UserResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * Provides profile management operations for application users.
 *
 * <p>This service is responsible only for user profile business logic. Authentication, credential
 * management and administrative operations are handled by their dedicated services.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
public interface UserService {

  /**
   * Retrieves the profile of the currently authenticated user.
   *
   * @return the authenticated user's profile
   */
  CurrentUserResponse me();

  /**
   * Resolves minimal public identities in one user query. Inactive/deleted users are excluded.
   *
   * @param userIds requested public identity IDs
   * @return active identities keyed by ID; no account or security fields
   */
  Map<UUID, PublicUserIdentityResponse> publicIdentities(Collection<UUID> userIds);

  /**
   * Retrieves minimal identity for an active user via the legacy authenticated endpoint.
   *
   * @param userId unique identifier of the user
   * @return minimal public identity, never account or security data
   */
  PublicUserIdentityResponse findById(UUID userId);

  /**
   * Updates the profile information of the currently authenticated user.
   *
   * @param request validated profile update request
   * @return the updated user profile
   */
  UserResponse updateProfile(UpdateProfileRequest request);

  /**
   * Updates the avatar of the currently authenticated user.
   *
   * @param avatar avatar image
   * @param crop optional framing metadata; the original image remains unchanged
   * @return the updated user profile
   */
  UserResponse updateAvatar(MultipartFile avatar, UpdateAvatarCropRequest crop);

  /**
   * Updates only the current user's avatar framing, retaining its original file and URL.
   *
   * @param request validated alignment and zoom
   * @return the profile with persisted framing metadata
   */
  UserResponse updateAvatarCrop(UpdateAvatarCropRequest request);

  /**
   * Removes the current user's avatar and restores the default avatar.
   *
   * @return the updated user profile
   */
  UserResponse removeAvatar();
}
