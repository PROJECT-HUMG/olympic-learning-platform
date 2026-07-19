package me.nghlong3004.olympic.user.service;

import me.nghlong3004.olympic.user.request.AdminCreateUserRequest;
import me.nghlong3004.olympic.user.response.AdminCreateUserResponse;

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
}
