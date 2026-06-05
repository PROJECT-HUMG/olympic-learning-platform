package me.nghlong3004.olympic.api.common.exception;

/**
 * Thrown when a duplicate resource conflict is detected.
 *
 * <p>Maps to HTTP 409 Conflict via {@code GlobalExceptionHandler}.
 * Example: "User with email 'abc@humg.edu.vn' already exists".
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public class DuplicateResourceException extends BaseException {

    public DuplicateResourceException(String resourceName, String field, Object value) {
        super(
                resourceName.toUpperCase() + "_DUPLICATE",
                "%s with %s '%s' already exists".formatted(resourceName, field, value)
        );
    }
}
