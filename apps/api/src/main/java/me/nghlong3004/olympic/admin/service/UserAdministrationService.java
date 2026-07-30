package me.nghlong3004.olympic.admin.service;

import java.util.UUID;
import me.nghlong3004.olympic.admin.request.AdminCreateUserRequest;
import me.nghlong3004.olympic.admin.response.AdminCreateUserResponse;
import me.nghlong3004.olympic.admin.response.AdminUserResponse;
import me.nghlong3004.olympic.user.enums.Permission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/18/2026
 */
public interface UserAdministrationService {

  /**
   * Creates an internal user account and sends an invite email with a one-time set-password link.
   * The generated placeholder password must never be returned or logged.
   *
   * @param request validated admin user creation payload
   * @param ip client IP address for invite-token audit metadata
   * @param userAgent client user-agent for invite-token audit metadata
   * @return created pending user response
   */
  AdminCreateUserResponse createUser(AdminCreateUserRequest request, String ip, String userAgent);

  /**
   * Grants a specific permission to a user.
   *
   * @param userId the ID of the user
   * @param permission the permission to grant
   */
  void grantPermission(UUID userId, Permission permission);
  
  /**
   * Revokes a specific permission from a user.
   *
   * @param userId the ID of the user
   * @param permission the permission to revoke
   */
  void revokePermission(UUID userId, Permission permission);

  /**
   * Search users with pagination.
   *
   * @param search the search keyword (email, username, or fullName)
   * @param pageable pagination parameters
   * @return paginated list of users with permissions
   */
  Page<AdminUserResponse> searchUsers(String search, Pageable pageable);
}
