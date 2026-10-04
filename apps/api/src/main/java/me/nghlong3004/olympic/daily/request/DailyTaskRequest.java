package me.nghlong3004.olympic.daily.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import me.nghlong3004.olympic.daily.enums.DailyTaskPriority;
import me.nghlong3004.olympic.daily.enums.DailyTaskStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Schema(
    description =
        "One plain-text task. Null id creates a task; an existing id must already belong to this plan.")
public record DailyTaskRequest(
    UUID id,
    @NotBlank @Size(max = 200) String title,
    @NotNull DailyTaskPriority priority,
    @NotNull DailyTaskStatus status) {}
