package me.nghlong3004.olympic.api.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/**
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 6/3/2026
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProblemDetailsResponse(
    String type,
    String title,
    int status,
    String detail,
    String instance,
    String code,
    List<ProblemFieldError> errors,
    String traceId,
    Long retryAfterSeconds) {
  public ProblemDetailsResponse {
    if (errors != null) {
      errors = List.copyOf(errors);
    }
  }
}
