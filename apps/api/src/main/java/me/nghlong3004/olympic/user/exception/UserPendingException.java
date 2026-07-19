package me.nghlong3004.olympic.user.exception;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/19/2026
 */
public class UserPendingException extends UserDomainException {
  public UserPendingException() {
    super("User email verification is required.");
  }
}
