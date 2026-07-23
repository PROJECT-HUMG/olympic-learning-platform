package me.nghlong3004.olympic.common.security;

/**
 * Provides access to the currently authenticated user.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
public interface CurrentUserProvider {

  /**
   * Returns the currently authenticated user.
   *
   * @return authenticated user
   * @throws UnauthenticatedException if no user is authenticated
   */
  CurrentUser getCurrentUser();
}
