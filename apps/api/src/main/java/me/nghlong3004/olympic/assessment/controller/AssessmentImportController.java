package me.nghlong3004.olympic.assessment.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.assessment.request.UpdateAssessmentDraftRequest;
import me.nghlong3004.olympic.assessment.response.AssessmentImportStatusResponse;
import me.nghlong3004.olympic.assessment.response.AssessmentQuestionDraftResponse;
import me.nghlong3004.olympic.assessment.service.AssessmentImportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@RestController
@RequestMapping("/api/v1/assessment-imports")
@RequiredArgsConstructor
@Tag(name = "Assessment imports", description = "Background PDF question extraction")
public class AssessmentImportController {

  private final AssessmentImportService assessmentImportService;

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.ACCEPTED)
  @Operation(summary = "Queue a mathematics assessment PDF for parsing")
  @ApiResponse(responseCode = "202", description = "Import queued")
  public AssessmentImportStatusResponse create(@RequestPart("file") MultipartFile file) {
    return assessmentImportService.create(file);
  }

  @GetMapping("/{id}")
  @Operation(summary = "Get assessment import progress")
  @ApiResponse(responseCode = "200", description = "Import status returned")
  @ApiResponse(responseCode = "404", description = "Import not found")
  public AssessmentImportStatusResponse getStatus(@PathVariable UUID id) {
    return assessmentImportService.getStatus(id);
  }

  @GetMapping("/{id}/drafts")
  @Operation(summary = "Get parsed question drafts")
  @ApiResponse(responseCode = "200", description = "Question drafts returned")
  @ApiResponse(responseCode = "404", description = "Import not found")
  public List<AssessmentQuestionDraftResponse> getDrafts(@PathVariable UUID id) {
    return assessmentImportService.getDrafts(id);
  }

  @PatchMapping("/{importId}/drafts/{draftId}")
  @Operation(summary = "Review and update a parsed question draft")
  @ApiResponse(responseCode = "200", description = "Draft updated")
  @ApiResponse(responseCode = "400", description = "Validation failed")
  @ApiResponse(responseCode = "404", description = "Import or draft not found")
  @ApiResponse(responseCode = "409", description = "Import is not reviewable")
  public AssessmentQuestionDraftResponse updateDraft(
      @PathVariable UUID importId,
      @PathVariable UUID draftId,
      @Valid @RequestBody UpdateAssessmentDraftRequest request) {
    return assessmentImportService.updateDraft(importId, draftId, request);
  }

  @PostMapping("/{importId}/drafts/{draftId}/approve")
  @Operation(summary = "Approve a parsed question draft")
  @ApiResponse(responseCode = "200", description = "Draft approved")
  @ApiResponse(responseCode = "404", description = "Import or draft not found")
  @ApiResponse(responseCode = "409", description = "Import is not reviewable")
  public AssessmentQuestionDraftResponse approveDraft(
      @PathVariable UUID importId, @PathVariable UUID draftId) {
    return assessmentImportService.approveDraft(importId, draftId);
  }

  @PostMapping("/{importId}/drafts/{draftId}/reject")
  @Operation(summary = "Reject a parsed question draft")
  @ApiResponse(responseCode = "200", description = "Draft rejected")
  @ApiResponse(responseCode = "404", description = "Import or draft not found")
  @ApiResponse(responseCode = "409", description = "Import is not reviewable")
  public AssessmentQuestionDraftResponse rejectDraft(
      @PathVariable UUID importId, @PathVariable UUID draftId) {
    return assessmentImportService.rejectDraft(importId, draftId);
  }

  @PostMapping("/{id}/approve-all")
  @Operation(summary = "Approve every draft still awaiting review")
  @ApiResponse(responseCode = "200", description = "Pending drafts approved")
  @ApiResponse(responseCode = "404", description = "Import not found")
  @ApiResponse(responseCode = "409", description = "Import is not reviewable")
  public void approveAll(@PathVariable UUID id) {
    assessmentImportService.approveAll(id);
  }

  @PostMapping("/{id}/publish")
  @Operation(summary = "Publish approved drafts to the question bank")
  @ApiResponse(responseCode = "200", description = "Approved drafts published")
  @ApiResponse(responseCode = "400", description = "Approved draft content is invalid")
  @ApiResponse(responseCode = "404", description = "Import or related resource not found")
  @ApiResponse(responseCode = "409", description = "Review is incomplete or state changed")
  public AssessmentImportStatusResponse publish(@PathVariable UUID id) {
    return assessmentImportService.publish(id);
  }

  @PostMapping("/{id}/retry")
  @Operation(summary = "Retry a failed assessment import")
  @ApiResponse(responseCode = "200", description = "Import requeued")
  @ApiResponse(responseCode = "404", description = "Import not found")
  @ApiResponse(responseCode = "409", description = "Import has not failed")
  public AssessmentImportStatusResponse retry(@PathVariable UUID id) {
    return assessmentImportService.retry(id);
  }
}
