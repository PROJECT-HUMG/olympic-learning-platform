package me.nghlong3004.olympic.recognition.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import me.nghlong3004.olympic.recognition.enums.AchievementStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
public record ReviewAchievementRequest(
    @NotNull AchievementStatus status,
    @Size(max = 2000) String note,
    @Schema(description = "The version displayed when reviewing") @NotNull @Min(0) Long expectedVersion) {}
