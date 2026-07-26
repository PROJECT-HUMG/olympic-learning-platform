package me.nghlong3004.olympic.document.service;

import java.util.List;
import me.nghlong3004.olympic.document.response.TagSummaryResponse;

/**
 * Provides business operations for managing tags.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
public interface TagService {

  /**
   * Retrieves all enabled tags, ordered alphabetically by name.
   *
   * @return list of enabled tag summaries
   */
  List<TagSummaryResponse> getAllEnabledTags();
}
