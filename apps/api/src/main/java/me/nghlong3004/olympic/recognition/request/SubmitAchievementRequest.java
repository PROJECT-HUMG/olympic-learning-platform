package me.nghlong3004.olympic.recognition.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;
import me.nghlong3004.olympic.recognition.enums.AchievementAward;
import me.nghlong3004.olympic.recognition.enums.AchievementCategory;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
public record SubmitAchievementRequest(
    @Schema(description = "Only administrators can submit for another student") UUID userId,
    @NotBlank @Size(max = 200) String title,
    @Size(max = 10000) String description,
    @NotNull AchievementCategory category,
    @NotNull AchievementAward award,
    boolean includeParticipation,
    @NotNull @PastOrPresent LocalDate achievedDate,
    boolean publicVisible) {}
