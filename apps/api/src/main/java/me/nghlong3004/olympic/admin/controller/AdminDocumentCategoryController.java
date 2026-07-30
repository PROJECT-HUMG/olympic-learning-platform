package me.nghlong3004.olympic.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.document.request.CreateDocumentCategoryRequest;
import me.nghlong3004.olympic.document.request.UpdateDocumentCategoryRequest;
import me.nghlong3004.olympic.document.response.CategorySummaryResponse;
import me.nghlong3004.olympic.document.service.DocumentCategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@RestController
@RequestMapping("/api/v1/admin/document-categories")
@RequiredArgsConstructor
@Tag(name = "Admin Document Category", description = "Admin API for managing document categories")
public class AdminDocumentCategoryController {

  private final DocumentCategoryService categoryService;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create a new document category")
  public CategorySummaryResponse createCategory(@Valid @RequestBody CreateDocumentCategoryRequest request) {
    return categoryService.createCategory(request);
  }

  @PutMapping("/{id}")
  @Operation(summary = "Update an existing document category")
  public CategorySummaryResponse updateCategory(
      @PathVariable UUID id, @Valid @RequestBody UpdateDocumentCategoryRequest request) {
    return categoryService.updateCategory(id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Soft delete a document category")
  public void deleteCategory(@PathVariable UUID id) {
    categoryService.deleteCategory(id);
  }
}
