package me.nghlong3004.olympic.common.security;

import java.util.UUID;
import me.nghlong3004.olympic.common.config.JwtConfig;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import org.jspecify.annotations.NonNull;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.stereotype.Component;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
@Component
public class JwtCurrentUserAuthenticationConverter
    implements Converter<Jwt, AbstractAuthenticationToken> {

  @Override
  public AbstractAuthenticationToken convert(@NonNull Jwt jwt) {
    try {
      var currentUser =
          CurrentUser.builder()
              .id(UUID.fromString(requiredSubject(jwt)))
              .email(requiredClaim(jwt, JwtConfig.EMAIL_CLAIM))
              .username(requiredClaim(jwt, JwtConfig.USERNAME_CLAIM))
              .fullName(requiredClaim(jwt, JwtConfig.FULL_NAME_CLAIM))
              .role(Role.valueOf(requiredClaim(jwt, JwtConfig.ROLE_CLAIM)))
              .status(Status.valueOf(requiredClaim(jwt, JwtConfig.STATUS_CLAIM)))
              .build();

      return new CurrentUserAuthenticationToken(jwt, currentUser);
    } catch (IllegalArgumentException exception) {
      throw new InvalidBearerTokenException("Access token contains invalid claims", exception);
    }
  }

  private String requiredSubject(Jwt jwt) {
    var subject = jwt.getSubject();

    if (subject == null || subject.isBlank()) {
      throw new IllegalArgumentException("Missing JWT subject");
    }

    return subject;
  }

  private String requiredClaim(Jwt jwt, String claimName) {
    var value = jwt.getClaimAsString(claimName);

    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException("Missing JWT claim: " + claimName);
    }

    return value;
  }
}
