package me.nghlong3004.olympic.document.exception;

import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
public class SubjectNotFoundException extends RuntimeException {

  public SubjectNotFoundException(UUID id) {
    super("Subject not found with ID: " + id);
  }

  public SubjectNotFoundException(String code) {
    super("Subject not found with code: " + code);
  }
}
