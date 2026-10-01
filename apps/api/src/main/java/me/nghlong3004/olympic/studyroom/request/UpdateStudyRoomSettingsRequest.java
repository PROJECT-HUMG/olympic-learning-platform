package me.nghlong3004.olympic.studyroom.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomRequestPolicy;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
public record UpdateStudyRoomSettingsRequest(
    @Schema(example = "AFTER_FOCUS") @NotNull StudyRoomRequestPolicy requestPolicy,
    @Schema(example = "15") @NotNull @Min(0) @Max(120) Integer minimumStudyMinutes) {}
