package me.nghlong3004.olympic.daily.feedback.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.daily.feedback.request.SaveDailyFeedbackRequest;
import me.nghlong3004.olympic.daily.feedback.response.DailyFeedbackContributionResponse;
import me.nghlong3004.olympic.daily.feedback.response.DailyFeedbackResponse;
import me.nghlong3004.olympic.daily.feedback.service.DailyFeedbackService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@RestController
@RequestMapping("/api/v1/groups/{groupId}/daily/{ownerId}/{kind:plans|weeks}/{reviewId}/feedback")
@RequiredArgsConstructor
@Tag(name = "Daily Feedback", description = "Identified editable group-context contribution")
public class DailyFeedbackController {
  private final DailyFeedbackService service;

  @GetMapping
  @Operation(summary = "Read currently permitted identified contributors")
  @ApiResponse(responseCode = "200")
  public DailyFeedbackResponse list(
      @PathVariable UUID groupId,
      @PathVariable UUID ownerId,
      @PathVariable String kind,
      @PathVariable UUID reviewId) {
    return service.list(groupId, ownerId, kind, reviewId);
  }

  @PutMapping
  @Operation(summary = "Create or version-update own feedback")
  @ApiResponse(responseCode = "200")
  public DailyFeedbackContributionResponse save(
      @PathVariable UUID groupId,
      @PathVariable UUID ownerId,
      @PathVariable String kind,
      @PathVariable UUID reviewId,
      @Valid @RequestBody SaveDailyFeedbackRequest request) {
    return service.save(groupId, ownerId, kind, reviewId, request);
  }

  @DeleteMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Delete own feedback at exact version")
  @ApiResponse(responseCode = "204")
  public void remove(
      @PathVariable UUID groupId,
      @PathVariable UUID ownerId,
      @PathVariable String kind,
      @PathVariable UUID reviewId,
      @RequestParam Long expectedVersion) {
    service.remove(groupId, ownerId, kind, reviewId, expectedVersion);
  }
}
