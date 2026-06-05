package me.nghlong3004.olympic.api.common.exception;

/**
 * Thrown when a business rule is violated.
 *
 * <p>Maps to HTTP 422 Unprocessable Entity via {@code GlobalExceptionHandler}.
 * Examples: "Only VERIFIED questions can be added to official tests",
 * "Enrollment deadline has passed".
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public class BusinessRuleException extends BaseException {

    public BusinessRuleException(String errorCode, String message) {
        super(errorCode, message);
    }
}
