package me.nghlong3004.olympic.daily.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import me.nghlong3004.olympic.daily.enums.DailyTaskPriority;
import me.nghlong3004.olympic.daily.enums.DailyTaskStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/6/2026
 */
@Schema(description = "Append one task without saving other edits, submitting or enabling sharing")
public record AddDailyTaskRequest(
    @Schema(description = "Stable client UUID reused for transport retries") @NotNull UUID taskId,
    @Schema(description = "Saved plan version; null only for a new plan") @PositiveOrZero Long expectedVersion,
    @NotBlank @Size(max = 200) String title,
    @NotNull DailyTaskPriority priority,
    @NotNull DailyTaskStatus status) {}
