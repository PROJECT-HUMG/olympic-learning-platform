package me.nghlong3004.olympic.document.exception;

import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
public class CategoryNotFoundException extends RuntimeException {

  public CategoryNotFoundException(UUID id) {
    super("Category not found with ID: " + id);
  }

  public CategoryNotFoundException(String code) {
    super("Category not found with code: " + code);
  }
}
