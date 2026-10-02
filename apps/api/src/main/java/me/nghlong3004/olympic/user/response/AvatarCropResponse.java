package me.nghlong3004.olympic.user.response;

import io.swagger.v3.oas.annotations.media.Schema;
import me.nghlong3004.olympic.user.entity.AvatarCrop;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
public record AvatarCropResponse(
    @Schema(description = "Horizontal alignment from 0 (left) to 1 (right)") double x,
    @Schema(description = "Vertical alignment from 0 (top) to 1 (bottom)") double y,
    @Schema(description = "Cover scale from 1 to 3") double zoom) {
  public static AvatarCropResponse fromEntity(AvatarCrop crop) {
    return crop == null ? null : new AvatarCropResponse(crop.getX(), crop.getY(), crop.getZoom());
  }
}
