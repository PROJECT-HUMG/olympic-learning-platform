package me.nghlong3004.olympic.document.exception;

import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
public class TagNotFoundException extends RuntimeException {

  public TagNotFoundException(UUID id) {
    super("Tag not found with ID: " + id);
  }

  public TagNotFoundException(String code) {
    super("Tag not found with code: " + code);
  }
}
