package me.nghlong3004.olympic.user.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.GrantedAuthority;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
@Getter
@RequiredArgsConstructor
public enum Role implements GrantedAuthority {
  STUDENT,
  LECTURER,
  ADMIN;

  @Override
  public @NonNull String getAuthority() {
    return "ROLE_" + name();
  }
}
