package me.nghlong3004.olympic.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
public record AuthMessageResponse(
    @Schema(example = "Request accepted") String message,
    @Schema(example = "success.auth") String messageKey) {}
