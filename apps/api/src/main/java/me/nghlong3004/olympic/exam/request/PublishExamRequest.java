package me.nghlong3004.olympic.exam.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public record PublishExamRequest(
    @Schema(description = "Optimistic draft version") @NotNull Long expectedVersion) {}
