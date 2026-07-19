package me.nghlong3004.olympic.user.exception;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/19/2026
 */
public class UserDisabledException extends UserDomainException {
  public UserDisabledException() {
    super("User account is disabled or deleted.");
  }
}
