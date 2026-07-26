package me.nghlong3004.olympic.document.exception;

import java.util.UUID;

/**
 * Thrown when a document cannot be found.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
public class DocumentNotFoundException extends RuntimeException {

  public DocumentNotFoundException(UUID id) {
    super("Document not found with id: " + id);
  }

  public DocumentNotFoundException(String slug) {
    super("Document not found with slug: " + slug);
  }
}
