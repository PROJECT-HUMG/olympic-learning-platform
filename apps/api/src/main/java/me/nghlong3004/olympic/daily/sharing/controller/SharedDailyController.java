package me.nghlong3004.olympic.daily.sharing.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.daily.response.DailyPlanResponse;
import me.nghlong3004.olympic.daily.response.DailyWeekResponse;
import me.nghlong3004.olympic.daily.sharing.response.SharedDailyDashboardResponse;
import me.nghlong3004.olympic.daily.sharing.service.SharedDailyService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@RestController
@RequestMapping("/api/v1/groups/{groupId}/daily")
@RequiredArgsConstructor
@Tag(name = "Shared Daily", description = "Current-authorized historical reads")
public class SharedDailyController {
  private final SharedDailyService service;

  @GetMapping
  @Operation(summary = "Read selected-day active group summary")
  @ApiResponse(responseCode = "200")
  public SharedDailyDashboardResponse dashboard(
      @PathVariable UUID groupId, @RequestParam LocalDate date) {
    return service.dashboard(groupId, date);
  }

  @GetMapping("/{ownerId}/plans")
  @Operation(summary = "Read current-authorized saved day")
  @ApiResponse(responseCode = "200")
  public DailyPlanResponse plan(
      @PathVariable UUID groupId, @PathVariable UUID ownerId, @RequestParam LocalDate date) {
    return service.readPlan(groupId, ownerId, date);
  }

  @GetMapping("/{ownerId}/weeks")
  @Operation(summary = "Read current-authorized historical week")
  @ApiResponse(responseCode = "200")
  public DailyWeekResponse week(
      @PathVariable UUID groupId, @PathVariable UUID ownerId, @RequestParam LocalDate weekStart) {
    return service.readWeek(groupId, ownerId, weekStart);
  }
}
