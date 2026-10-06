package me.nghlong3004.olympic.daily.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.daily.request.SaveDailyPlanRequest;
import me.nghlong3004.olympic.daily.request.AddDailyTaskRequest;
import me.nghlong3004.olympic.daily.request.SaveDailyWeekRequest;
import me.nghlong3004.olympic.daily.response.DailyPlanResponse;
import me.nghlong3004.olympic.daily.response.DailyWeekResponse;
import me.nghlong3004.olympic.daily.service.DailyService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Owner-only Daily routes. Authenticated access is the existing default security chain.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@RestController
@RequestMapping("/api/v1/daily")
@RequiredArgsConstructor
@Tag(name = "Daily", description = "Personal date plans, first submission, and weekly reflection")
public class DailyController {

  private final DailyService service;

  @PostMapping("/plans/tasks")
  @Operation(summary = "Append one owned task without saving other edits or submitting the plan")
  @ApiResponse(responseCode = "200", description = "Saved plan including the appended task")
  @ApiResponse(responseCode = "409", description = "Stale plan, changed retry or task identity collision")
  public DailyPlanResponse addTask(
      @RequestParam LocalDate date, @Valid @RequestBody AddDailyTaskRequest request) {
    return service.addTask(date, request);
  }

  @GetMapping("/plans")
  @Operation(summary = "Read the authenticated owner's plan for a platform date")
  @ApiResponse(responseCode = "200", description = "Owned plan")
  @ApiResponse(responseCode = "404", description = "No plan for this owner and date")
  public DailyPlanResponse plan(@RequestParam LocalDate date) {
    return service.getPlan(date);
  }

  @PutMapping("/plans")
  @Operation(summary = "Create or update the authenticated owner's plan for a platform date")
  @ApiResponse(responseCode = "200", description = "Saved plan")
  @ApiResponse(
      responseCode = "409",
      description = "Stale version, duplicate date, or task from another plan")
  public DailyPlanResponse savePlan(
      @RequestParam LocalDate date, @Valid @RequestBody SaveDailyPlanRequest request) {
    return service.savePlan(date, request);
  }

  @PostMapping("/plans/{planId}/submit")
  @Operation(summary = "Record the first server submission timestamp without replacing it later")
  @ApiResponse(responseCode = "200", description = "Plan with its original submission timestamp")
  @ApiResponse(responseCode = "403", description = "Plan belongs to another owner")
  public DailyPlanResponse submit(@PathVariable UUID planId) {
    return service.submitPlan(planId);
  }

  @GetMapping("/plans/dates")
  @Operation(summary = "List all distinct dates that have a plan for the authenticated owner")
  @ApiResponse(responseCode = "200", description = "List of platform dates")
  public List<LocalDate> planDates() {
    return service.getPlanDates();
  }

  @GetMapping("/weeks")
  @Operation(summary = "Read the authenticated owner's weekly aggregate and reflection")
  @ApiResponse(responseCode = "200", description = "Week aggregate; reflection is null until saved")
  public DailyWeekResponse week(@RequestParam LocalDate weekStart) {
    return service.getWeek(weekStart);
  }

  @PutMapping("/weeks")
  @Operation(summary = "Create or update the authenticated owner's weekly reflection")
  @ApiResponse(responseCode = "200", description = "Saved week")
  @ApiResponse(responseCode = "409", description = "Stale version or duplicate week")
  public DailyWeekResponse saveWeek(
      @RequestParam LocalDate weekStart, @Valid @RequestBody SaveDailyWeekRequest request) {
    return service.saveWeek(weekStart, request);
  }
}
