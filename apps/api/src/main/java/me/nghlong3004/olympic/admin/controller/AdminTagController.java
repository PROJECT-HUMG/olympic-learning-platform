package me.nghlong3004.olympic.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.document.request.CreateTagRequest;
import me.nghlong3004.olympic.document.request.UpdateTagRequest;
import me.nghlong3004.olympic.document.response.TagSummaryResponse;
import me.nghlong3004.olympic.document.service.TagService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@RestController
@RequestMapping("/api/v1/admin/tags")
@RequiredArgsConstructor
@Tag(name = "Admin Tag", description = "Admin API for managing tags")
public class AdminTagController {

  private final TagService tagService;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create a new tag")
  public TagSummaryResponse createTag(@Valid @RequestBody CreateTagRequest request) {
    return tagService.createTag(request);
  }

  @PutMapping("/{id}")
  @Operation(summary = "Update an existing tag")
  public TagSummaryResponse updateTag(
      @PathVariable UUID id, @Valid @RequestBody UpdateTagRequest request) {
    return tagService.updateTag(id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Soft delete a tag")
  public void deleteTag(@PathVariable UUID id) {
    tagService.deleteTag(id);
  }
}
