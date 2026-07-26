package me.nghlong3004.olympic.document.service;

import java.util.List;
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
}
