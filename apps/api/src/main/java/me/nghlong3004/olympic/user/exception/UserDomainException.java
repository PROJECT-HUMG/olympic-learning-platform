package me.nghlong3004.olympic.user.exception;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/19/2026
 */
public abstract class UserDomainException extends RuntimeException {
  protected UserDomainException(String message) {
    super(message);
  }
}
