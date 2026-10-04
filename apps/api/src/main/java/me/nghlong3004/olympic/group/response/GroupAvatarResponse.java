package me.nghlong3004.olympic.group.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;
import me.nghlong3004.olympic.user.response.AvatarCropResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record GroupAvatarResponse(
    @Schema(description = "Current image identifier; bytes require active membership") UUID id,
    @Schema(description = "Profile-compatible framing of the original image") AvatarCropResponse crop) {}
