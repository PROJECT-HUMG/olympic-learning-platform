package me.nghlong3004.olympic.api.common.exception;

/**
 * Base exception for all domain-specific business exceptions.
 *
 * <p>Carries an error code in {@code SCREAMING_SNAKE_CASE} format
 * for consistent error response mapping via {@code ProblemDetail}.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public abstract class BaseException extends RuntimeException {

    private final String errorCode;

    protected BaseException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    protected BaseException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
