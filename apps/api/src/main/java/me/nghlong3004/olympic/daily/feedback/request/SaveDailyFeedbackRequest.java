package me.nghlong3004.olympic.daily.feedback.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record SaveDailyFeedbackRequest(
    @Schema(description = "Identified multiline contribution") @NotBlank @Size(max = 4000)
        String text,
    @Schema(description = "Null only when creating") @PositiveOrZero Long expectedVersion) {}
