package me.nghlong3004.olympic.group.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Same framing contract as the personal profile; never changes a personal avatar.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record UpdateGroupAvatarCropRequest(
    @Schema(description = "Horizontal alignment from 0 to 1", example = "0.5")
        @NotNull @DecimalMin("0") @DecimalMax("1") Double x,
    @Schema(description = "Vertical alignment from 0 to 1", example = "0.5")
        @NotNull @DecimalMin("0") @DecimalMax("1") Double y,
    @Schema(description = "Cover scale from 1 to 3", example = "1")
        @NotNull @DecimalMin("1") @DecimalMax("3") Double zoom) {}
