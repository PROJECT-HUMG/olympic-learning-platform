package me.nghlong3004.olympic.document.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.document.response.DocumentMetadataResponse;
import me.nghlong3004.olympic.document.service.DocumentCategoryService;
import me.nghlong3004.olympic.document.service.SubjectService;
import me.nghlong3004.olympic.document.service.TagService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@RestController
@RequestMapping("/api/v1/documents/metadata")
@RequiredArgsConstructor
@Tag(name = "Document Metadata", description = "Fetch all filter options (categories, subjects, tags)")
public class DocumentMetadataController {

  private final DocumentCategoryService categoryService;
  private final SubjectService subjectService;
  private final TagService tagService;

  @GetMapping
  @Operation(summary = "Get all active categories, subjects and tags for filtering")
  public DocumentMetadataResponse getMetadata() {
    return new DocumentMetadataResponse(
        categoryService.getAllEnabledCategories(),
        subjectService.getAllEnabledSubjects(),
        tagService.getAllEnabledTags()
    );
  }
}
