package me.nghlong3004.olympic.api.common.exception;

import jakarta.validation.ConstraintViolationException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.NoSuchElementException;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.NoHandlerFoundException;

/**
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 5/24/2026
 */
@Slf4j
@RestControllerAdvice
public class GlobalException {

  private final ProblemDetailsFactory problemDetailsFactory;

  public GlobalException(ProblemDetailsFactory problemDetailsFactory) {
    this.problemDetailsFactory = problemDetailsFactory;
  }

  @ExceptionHandler(ResourceException.class)
  public ResponseEntity<ProblemDetailsResponse> handleResourceException(
      final ResourceException e, HttpServletRequest request) {
    log.warn("Application error [{}]: {}", e.getErrorCode().getCode(), e.getMessage());
    return buildResponse(
        problemDetailsFactory.create(
            request, e.getErrorCode(), e.getErrors(), e.getRetryAfterSeconds()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ProblemDetailsResponse> handleMethodArgumentNotValid(
      MethodArgumentNotValidException ex, HttpServletRequest request) {
    var fieldErrors =
        ex.getBindingResult().getFieldErrors().stream()
            .map(error -> new ProblemFieldError(error.getField(), error.getDefaultMessage()))
            .toList();
    log.debug("Validation failed: {}", fieldErrors);
    return buildResponse(problemDetailsFactory.create(request, ErrorCode.VALIDATION_ERROR, fieldErrors));
  }

  @ExceptionHandler(HandlerMethodValidationException.class)
  public ResponseEntity<ProblemDetailsResponse> handleHandlerMethodValidation(
      HandlerMethodValidationException ex, HttpServletRequest request) {
    var details =
        ex.getParameterValidationResults().stream()
            .flatMap(
                result ->
                    result.getResolvableErrors().stream()
                        .map(
                            error ->
                                new ProblemFieldError(
                                    result.getMethodParameter().getParameterName(),
                                    error.getDefaultMessage())))
            .toList();
    log.debug("Handler method validation failed: {}", details);
    return buildResponse(problemDetailsFactory.create(request, ErrorCode.VALIDATION_ERROR, details));
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ProblemDetailsResponse> handleConstraintViolation(
      ConstraintViolationException ex, HttpServletRequest request) {
    var details =
        ex.getConstraintViolations().stream()
            .map(v -> new ProblemFieldError(v.getPropertyPath().toString(), v.getMessage()))
            .toList();
    log.debug("Constraint violation: {}", details);
    return buildResponse(problemDetailsFactory.create(request, ErrorCode.VALIDATION_ERROR, details));
  }

  @ExceptionHandler({
    MissingServletRequestParameterException.class,
    MissingServletRequestPartException.class
  })
  public ResponseEntity<ProblemDetailsResponse> handleMissingParameterException(
      Exception e, HttpServletRequest request) {
    log.debug("Missing request parameter/part: {}", e.getMessage());
    return buildResponse(request, ErrorCode.MISSING_PARAMETER);
  }

  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<ProblemDetailsResponse> handleTypeMismatchException(
      MethodArgumentTypeMismatchException e, HttpServletRequest request) {
    log.debug("Type mismatch for parameter '{}': {}", e.getName(), e.getMessage());
    var errors = List.of(new ProblemFieldError(e.getName(), "Invalid value."));
    return buildResponse(problemDetailsFactory.create(request, ErrorCode.VALIDATION_ERROR, errors));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ProblemDetailsResponse> handleHttpMessageNotReadableException(
      HttpMessageNotReadableException e, HttpServletRequest request) {
    log.debug("Malformed JSON request: {}", e.getMessage());
    return buildResponse(request, ErrorCode.HTTP_MESSAGE_NOT_READABLE);
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ProblemDetailsResponse> handleAccessDeniedException(
      AccessDeniedException e, HttpServletRequest request) {
    log.warn("Access denied: {}", e.getMessage());
    return buildResponse(request, ErrorCode.ACCESS_DENIED);
  }

  @ExceptionHandler({NoHandlerFoundException.class, NoSuchElementException.class})
  public ResponseEntity<ProblemDetailsResponse> handleNotFoundException(
      Exception e, HttpServletRequest request) {
    log.debug("Resource not found: {}", e.getMessage());
    return buildResponse(request, ErrorCode.RESOURCE_NOT_FOUND);
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ProblemDetailsResponse> handleMethodNotAllowed(
      HttpRequestMethodNotSupportedException e, HttpServletRequest request) {
    log.debug("Method not allowed: {}", e.getMessage());
    return buildResponse(request, ErrorCode.METHOD_NOT_ALLOWED);
  }

  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  public ResponseEntity<ProblemDetailsResponse> handleUnsupportedMediaType(
      HttpMediaTypeNotSupportedException e, HttpServletRequest request) {
    log.debug("{}", e.getMessage());
    return buildResponse(request, ErrorCode.UNSUPPORTED_MEDIA_TYPE);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ProblemDetailsResponse> handleRuntimeException(
      final Exception e, HttpServletRequest request) {
    log.error("Unhandled Exception: ", e);
    return buildResponse(request, ErrorCode.INTERNAL_SERVER_ERROR);
  }

  private ResponseEntity<ProblemDetailsResponse> buildResponse(
      HttpServletRequest request, ErrorCode errorCode) {
    return buildResponse(problemDetailsFactory.create(request, errorCode));
  }

  private ResponseEntity<ProblemDetailsResponse> buildResponse(ProblemDetailsResponse response) {
    var responseBuilder =
        ResponseEntity.status(HttpStatus.valueOf(response.status()))
            .contentType(MediaType.APPLICATION_PROBLEM_JSON);
    if (response.retryAfterSeconds() != null) {
      responseBuilder.header(HttpHeaders.RETRY_AFTER, response.retryAfterSeconds().toString());
    }
    return responseBuilder.body(response);
  }
}
