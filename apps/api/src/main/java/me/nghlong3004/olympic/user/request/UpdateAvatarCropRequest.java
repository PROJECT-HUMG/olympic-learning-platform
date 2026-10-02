package me.nghlong3004.olympic.user.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
public record UpdateAvatarCropRequest(
    @Schema(description = "Horizontal alignment: 0 is left, 0.5 center, 1 right", example = "0.5")
        @NotNull @DecimalMin("0") @DecimalMax("1") Double x,
    @Schema(description = "Vertical alignment: 0 is top, 0.5 center, 1 bottom", example = "0.5")
        @NotNull @DecimalMin("0") @DecimalMax("1") Double y,
    @Schema(description = "Scale relative to a centered cover crop, from 1 to 3", example = "1")
        @NotNull @DecimalMin("1") @DecimalMax("3") Double zoom) {}
