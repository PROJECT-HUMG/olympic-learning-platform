package me.nghlong3004.olympic.common.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/18/2026
 */
@ConfigurationProperties(prefix = "olympic.mail")
public record MailProperties(Boolean enabled, String from) {

  public MailProperties {
    if (enabled == null) {
      enabled = true;
    }
    if (from == null || from.isBlank() || from.startsWith("${")) {
      from = "no-reply@nghlong3004.me";
    }
  }
}
