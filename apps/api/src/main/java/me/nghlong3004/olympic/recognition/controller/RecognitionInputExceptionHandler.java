package me.nghlong3004.olympic.recognition.controller;

import jakarta.servlet.http.HttpServletRequest;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.error.GlobalExceptionHandler;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

/**
 * Malformed multipart/JSON/UUID input is a client error, not an internal server failure.
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = {RecognitionController.class, AdminRecognitionController.class})
public class RecognitionInputExceptionHandler {
  @ExceptionHandler({MissingServletRequestPartException.class, HttpMessageNotReadableException.class,
      MethodArgumentTypeMismatchException.class})
  public ProblemDetail invalidInput(Exception exception, HttpServletRequest request) {
    ApiException invalid = ErrorCode.VALIDATION_ERROR.throwIt("Invalid or missing recognition request data");
    return new GlobalExceptionHandler().handleApiException(invalid, request);
  }
}
