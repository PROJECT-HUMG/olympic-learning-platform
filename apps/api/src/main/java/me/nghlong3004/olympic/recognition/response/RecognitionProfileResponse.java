package me.nghlong3004.olympic.recognition.response;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.user.response.AvatarCropResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
public record RecognitionProfileResponse(UUID userId, String fullName, String username,
    String avatarUrl, AvatarCropResponse avatarCrop,
    boolean rankingOptIn, long publicPoints, List<PublicAchievementResponse> achievements) {}
