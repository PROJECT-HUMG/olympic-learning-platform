package me.nghlong3004.olympic.user.enums;

import org.jspecify.annotations.NonNull;
import org.springframework.security.core.GrantedAuthority;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/30/2026
 */
public enum Permission implements GrantedAuthority {
  DOCUMENT_UPLOAD("Tải lên tài liệu");

  private final String description;

  Permission(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }

  @Override
  public @NonNull String getAuthority() {
    return name();
  }
}
