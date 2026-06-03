package me.nghlong3004.olympic.api.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 6/3/2026
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProblemFieldError(String field, String message) {}
