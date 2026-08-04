package me.nghlong3004.olympic.post.service;

import java.util.UUID;
import me.nghlong3004.olympic.post.request.CreatePostRequest;
import me.nghlong3004.olympic.post.request.UpdatePostRequest;
import me.nghlong3004.olympic.post.response.PostDetailResponse;
import me.nghlong3004.olympic.post.response.PostSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/04/2026
 */
public interface PostService {

  /**
   * Creates a new post.
   *
   * @param request the post creation payload
   * @return the created post detail
   */
  PostDetailResponse create(CreatePostRequest request);

  /**
   * Updates an existing post.
   *
   * @param id the ID of the post to update
   * @param request the update payload
   * @return the updated post detail
   */
  PostDetailResponse update(UUID id, UpdatePostRequest request);

  /**
   * Retrieves a post by its slug. Increments the view count.
   *
   * @param slug the post slug
   * @return the post detail
   */
  PostDetailResponse getBySlug(String slug);

  /**
   * Retrieves a post by its ID.
   *
   * @param id the post ID
   * @return the post detail
   */
  PostDetailResponse getById(UUID id);

  /**
   * Retrieves a paginated list of posts.
   *
   * @param pageable pagination information
   * @return a page of post summaries
   */
  Page<PostSummaryResponse> getAll(Pageable pageable);

  /**
   * Soft deletes a post by its ID.
   *
   * @param id the post ID
   */
  void delete(UUID id);
}
