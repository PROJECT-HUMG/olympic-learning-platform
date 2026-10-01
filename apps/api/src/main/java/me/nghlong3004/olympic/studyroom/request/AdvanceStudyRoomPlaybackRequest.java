package me.nghlong3004.olympic.studyroom.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
public record AdvanceStudyRoomPlaybackRequest(
    @Schema(description = "Version from the latest playback snapshot", example = "0") @NotNull @Min(0) Long expectedVersion) {}
