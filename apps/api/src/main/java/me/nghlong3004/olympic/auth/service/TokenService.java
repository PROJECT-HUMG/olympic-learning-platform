package me.nghlong3004.olympic.auth.service;

import me.nghlong3004.olympic.user.entity.User;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
public interface TokenService {

  /**
   * Issues a short-lived JWT access token for an active user.
   *
   * @param user active authenticated user
   * @return signed JWT token value
   */
  String issueAccessToken(User user);

  /**
   * Returns the configured access-token lifetime in seconds.
   *
   * @return access-token TTL in seconds
   */
  long accessExpiresInSeconds();
}
