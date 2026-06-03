package me.nghlong3004.olympic.api.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 6/3/2026
 */
@Component
public class ProblemDetailsFactory {
  private static final String TRACE_ID_HEADER = "X-Trace-Id";

  private final String problemTypeBaseUrl;

  public ProblemDetailsFactory(
      @Value("${olympic.api.problem-type-base-url}") String problemTypeBaseUrl) {
    this.problemTypeBaseUrl = trimTrailingSlash(problemTypeBaseUrl);
  }

  public ProblemDetailsResponse create(HttpServletRequest request, ErrorCode errorCode) {
    return create(request, errorCode, null, null);
  }

  public ProblemDetailsResponse create(
      HttpServletRequest request, ErrorCode errorCode, List<ProblemFieldError> errors) {
    return create(request, errorCode, errors, null);
  }

  public ProblemDetailsResponse create(
      HttpServletRequest request,
      ErrorCode errorCode,
      List<ProblemFieldError> errors,
      Long retryAfterSeconds) {
    return new ProblemDetailsResponse(
        problemTypeBaseUrl + "/" + toProblemSlug(errorCode.getCode()),
        errorCode.getTitle(),
        errorCode.getStatus(),
        errorCode.getMessage(),
        request.getRequestURI(),
        errorCode.getCode(),
        errors,
        resolveTraceId(request),
        retryAfterSeconds);
  }

  private String resolveTraceId(HttpServletRequest request) {
    String existingTraceId = request.getHeader(TRACE_ID_HEADER);
    if (existingTraceId != null && !existingTraceId.isBlank()) {
      return existingTraceId;
    }
    return UUID.randomUUID().toString();
  }

  private String toProblemSlug(String code) {
    return code.toLowerCase(Locale.ROOT).replace('_', '-');
  }

  private String trimTrailingSlash(String value) {
    return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
  }
}
