package me.nghlong3004.olympic.common.util;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.common.properties.ClientProperties;
import org.springframework.stereotype.Component;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/18/2026
 */
@Component
@RequiredArgsConstructor
public class AuthLinkBuilder {

	
  private final ClientProperties clientProperties;

  public String verificationLink(String token) {
    return clientProperties.baseUrl() + "/verify-email?token=" + encode(token);
  }

  public String resetLink(String token) {
    return clientProperties.baseUrl() + "/reset-password?token=" + encode(token);
  }

  public String inviteLink(String token) {
    return clientProperties.baseUrl() + "/reset-password?token=" + encode(token);
  }

  /**
   * Trims and lower-cases an email address for consistent lookup behaviour.
   *
   * @param email raw email input
   * @return normalised email
   */
  public static String normalizeEmail(String email) {
    return email.trim().toLowerCase();
  }

  private static String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
