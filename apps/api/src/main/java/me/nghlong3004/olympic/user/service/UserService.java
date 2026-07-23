package me.nghlong3004.olympic.user.service;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
import java.util.UUID;
import me.nghlong3004.olympic.auth.response.CurrentUserResponse;
import me.nghlong3004.olympic.user.request.UpdateProfileRequest;
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
   * Retrieves the public profile of a user.
   *
   * @param userId unique identifier of the user
   * @return the user's public profile
   */
  UserResponse findById(UUID userId);

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
   * @return the updated user profile
   */
  UserResponse updateAvatar(MultipartFile avatar);

  /**
   * Removes the current user's avatar and restores the default avatar.
   *
   * @return the updated user profile
   */
  UserResponse removeAvatar();
}
