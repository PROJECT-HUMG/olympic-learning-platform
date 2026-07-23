package me.nghlong3004.olympic.common.security;

import me.nghlong3004.olympic.common.error.ErrorCode;

/**
 * Thrown when no authenticated user is available.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
public class UnauthenticatedException extends RuntimeException {

  public UnauthenticatedException() {
    super(ErrorCode.AUTHENTICATION_REQUIRED.getDefaultDetail());
  }
}
