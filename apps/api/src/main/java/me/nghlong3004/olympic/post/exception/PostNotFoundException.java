package me.nghlong3004.olympic.post.exception;

import java.util.UUID;

/**
 * Thrown when a post cannot be found.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/04/2026
 */
public class PostNotFoundException extends RuntimeException {

  public PostNotFoundException(UUID id) {
    super("Post not found with id: " + id);
  }

  public PostNotFoundException(String slug) {
    super("Post not found with slug: " + slug);
  }
}
