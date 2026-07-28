package me.nghlong3004.olympic.document.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.document.request.CreateSubjectRequest;
import me.nghlong3004.olympic.document.request.UpdateSubjectRequest;
import me.nghlong3004.olympic.document.response.SubjectSummaryResponse;
import me.nghlong3004.olympic.document.service.SubjectService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@RestController
@RequestMapping("/api/v1/admin/subjects")
@RequiredArgsConstructor
@Tag(name = "Admin Subject", description = "Admin API for managing subjects")
public class AdminSubjectController {

  private final SubjectService subjectService;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create a new subject")
  public SubjectSummaryResponse createSubject(@Valid @RequestBody CreateSubjectRequest request) {
    return subjectService.createSubject(request);
  }

  @PutMapping("/{id}")
  @Operation(summary = "Update an existing subject")
  public SubjectSummaryResponse updateSubject(
      @PathVariable UUID id, @Valid @RequestBody UpdateSubjectRequest request) {
    return subjectService.updateSubject(id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Soft delete a subject")
  public void deleteSubject(@PathVariable UUID id) {
    subjectService.deleteSubject(id);
  }
}
