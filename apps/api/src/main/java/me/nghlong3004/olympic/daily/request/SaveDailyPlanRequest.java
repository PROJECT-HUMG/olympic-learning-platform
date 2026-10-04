package me.nghlong3004.olympic.daily.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Schema(description = "Create or replace the authenticated owner's plan for the date in the query.")
public record SaveDailyPlanRequest(
    Long expectedVersion,
    @Size(max = 4000) String reviewReasons,
    @Size(max = 4000) String reviewWentWell,
    @Size(max = 4000) String reviewTomorrow,
    @NotNull @Size(max = 50) List<@Valid DailyTaskRequest> tasks) {}
