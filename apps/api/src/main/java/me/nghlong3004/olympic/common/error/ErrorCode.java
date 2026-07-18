package me.nghlong3004.olympic.common.error;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
  VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Validation failed", "error.validation"),
  AUTHENTICATION_REQUIRED(
      HttpStatus.UNAUTHORIZED, "Authentication is required", "error.auth.required"),
  INVALID_CREDENTIALS(
      HttpStatus.UNAUTHORIZED, "Invalid credentials", "error.auth.invalidCredentials"),
  REFRESH_TOKEN_MISSING(
      HttpStatus.UNAUTHORIZED, "Refresh token is missing", "error.auth.refreshMissing"),
  REFRESH_TOKEN_INVALID(
      HttpStatus.UNAUTHORIZED, "Refresh token is invalid", "error.auth.refreshInvalid"),
  REFRESH_TOKEN_EXPIRED(
      HttpStatus.UNAUTHORIZED, "Refresh token is expired", "error.auth.refreshExpired"),
  REGISTRATION_DISABLED(
      HttpStatus.FORBIDDEN, "Self registration is disabled", "error.auth.registrationDisabled"),
  EMAIL_NOT_VERIFIED(
      HttpStatus.FORBIDDEN, "Email verification is required", "error.auth.emailNotVerified"),
  EMAIL_TOKEN_MISSING(
      HttpStatus.BAD_REQUEST, "Email token is missing", "error.auth.emailTokenMissing"),
  EMAIL_TOKEN_INVALID(
      HttpStatus.BAD_REQUEST, "Email token is invalid", "error.auth.emailTokenInvalid"),
  EMAIL_TOKEN_EXPIRED(
      HttpStatus.BAD_REQUEST, "Email token is expired", "error.auth.emailTokenExpired"),
  USER_DISABLED(HttpStatus.FORBIDDEN, "User is disabled", "error.user.disabled"),
  ACCESS_DENIED(HttpStatus.FORBIDDEN, "Access denied", "error.accessDenied"),
  RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "Resource not found", "error.resource.notFound"),
  DUPLICATE_RESOURCE(HttpStatus.CONFLICT, "Resource already exists", "error.resource.duplicate"),
  INVALID_RESOURCE_NAME(
      HttpStatus.BAD_REQUEST, "Resource name is invalid", "error.resource.invalidName"),
  INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Internal error", "error.internal");

  private final HttpStatus status;
  private final String defaultDetail;
  private final String messageKey;

  public ApiException throwIt() {
    return new ApiException(this);
  }

  public ApiException throwIt(String detail) {
    return new ApiException(this, detail);
  }
}
