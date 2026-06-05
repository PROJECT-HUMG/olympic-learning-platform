package me.nghlong3004.olympic.api.common.exception;

/**
 * Thrown when a requested resource cannot be found.
 *
 * <p>Maps to HTTP 404 Not Found via {@code GlobalExceptionHandler}.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
public class ResourceNotFoundException extends BaseException {

    public ResourceNotFoundException(String resourceName, Object identifier) {
        super(
                resourceName.toUpperCase() + "_NOT_FOUND",
                "%s with identifier '%s' not found".formatted(resourceName, identifier)
        );
    }
}
