package me.nghlong3004.olympic.api.common.exception;

import java.util.List;
import lombok.Getter;

/**
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 5/24/2026
 */
@Getter
public class ResourceException extends RuntimeException {

  private final ErrorCode errorCode;
  private final List<ProblemFieldError> errors;
  private final Long retryAfterSeconds;

  public ResourceException(ErrorCode errorCode) {
    super(errorCode.getMessage());
    this.errorCode = errorCode;
    this.errors = null;
    this.retryAfterSeconds = null;
  }

  public ResourceException(ErrorCode errorCode, List<ProblemFieldError> errors) {
    super(errorCode.getMessage());
    this.errorCode = errorCode;
    this.errors = errors == null ? null : List.copyOf(errors);
    this.retryAfterSeconds = null;
  }

  public ResourceException(ErrorCode errorCode, long retryAfterSeconds) {
    super(errorCode.getMessage());
    this.errorCode = errorCode;
    this.errors = null;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
