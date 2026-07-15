package me.nghlong3004.olympic.auth.service;

import me.nghlong3004.olympic.user.entity.User;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
public interface TokenService {

  /**
   * Creates a short-lived access JWT for API authentication by a {@link User}.
   *
   * @param user authenticated {@link User}
   * @return signed access token
   */
  String createAccessToken(User user);

  /**
   * Creates a refresh UUID for session renewal by a {@link User}.
   *
   * @param user authenticated {@link User}
   * @return UUID refresh token
   */
  String createRefreshToken(User user);
}
