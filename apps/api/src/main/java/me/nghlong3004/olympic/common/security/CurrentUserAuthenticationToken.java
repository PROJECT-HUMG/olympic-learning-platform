package me.nghlong3004.olympic.common.security;

import java.util.List;
import lombok.Getter;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
public final class CurrentUserAuthenticationToken extends AbstractAuthenticationToken {

  @Getter private final Jwt jwt;
  private final CurrentUser currentUser;

  CurrentUserAuthenticationToken(Jwt jwt, CurrentUser currentUser) {
    super(List.of(currentUser.role()));
    this.jwt = jwt;
    this.currentUser = currentUser;
    setAuthenticated(true);
  }

  @Override
  public Object getCredentials() {
    return jwt;
  }

  @Override
  public CurrentUser getPrincipal() {
    return currentUser;
  }

  @Override
  public @NonNull String getName() {
    return currentUser.id().toString();
  }
}
