package me.nghlong3004.olympic.common.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
@ConfigurationProperties(prefix = "olympic.security")
public record SecurityProperties(
    long accessExpirationMinutes,
    long refreshExpirationMinutes,
    Jwt jwt,
    String encryptionKey,
    String encryptionSalt,
    Cookie cookie) {

  public SecurityProperties {
    if (accessExpirationMinutes <= 0) {
      accessExpirationMinutes = 15;
    }
    if (refreshExpirationMinutes <= 0) {
      refreshExpirationMinutes = 10080;
    }
    if (jwt == null) {
      jwt = new Jwt("");
    }
    if (cookie == null) {
      cookie = new Cookie(false, "lax");
    }
  }

  public record Jwt(String secretKey) {}

  public record Cookie(boolean secure, String sameSite) {}
}
