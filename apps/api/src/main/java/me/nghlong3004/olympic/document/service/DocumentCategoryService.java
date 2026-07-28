package me.nghlong3004.olympic.document.service;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.document.request.CreateDocumentCategoryRequest;
import me.nghlong3004.olympic.document.request.UpdateDocumentCategoryRequest;
import me.nghlong3004.olympic.document.response.CategorySummaryResponse;

/**
 * Provides business operations for managing document categories.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
public interface DocumentCategoryService {

  /**
   * Retrieves all enabled categories, ordered alphabetically by name.
   *
   * @return list of enabled category summaries
   */
  List<CategorySummaryResponse> getAllEnabledCategories();

  /**
   * Creates a new document category.
   *
   * @param request creation payload
   * @return created category summary
   */
  CategorySummaryResponse createCategory(CreateDocumentCategoryRequest request);

  /**
   * Updates an existing document category.
   *
   * @param id category ID
   * @param request update payload
   * @return updated category summary
   */
  CategorySummaryResponse updateCategory(UUID id, UpdateDocumentCategoryRequest request);

  /**
   * Soft deletes a document category by setting its status to disabled.
   *
   * @param id category ID
   */
  void deleteCategory(UUID id);
}
