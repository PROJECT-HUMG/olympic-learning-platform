package me.nghlong3004.olympic.user.service;

import me.nghlong3004.olympic.user.response.UserResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
public interface UserService {

  /**
   * Finds the current authenticated {@link me.nghlong3004.olympic.user.entity.User}.
   *
   * @param username normalized or raw username from the authenticated principal
   * @return current {@link UserResponse}
   */
  UserResponse getCurrentUser(String username);
}
