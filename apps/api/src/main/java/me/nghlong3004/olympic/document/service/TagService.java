package me.nghlong3004.olympic.document.service;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.document.request.CreateTagRequest;
import me.nghlong3004.olympic.document.request.UpdateTagRequest;
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

  /**
   * Creates a new tag.
   *
   * @param request creation payload
   * @return created tag summary
   */
  TagSummaryResponse createTag(CreateTagRequest request);

  /**
   * Updates an existing tag.
   *
   * @param id tag ID
   * @param request update payload
   * @return updated tag summary
   */
  TagSummaryResponse updateTag(UUID id, UpdateTagRequest request);

  /**
   * Soft deletes a tag by setting its status to disabled.
   *
   * @param id tag ID
   */
  void deleteTag(UUID id);
}
