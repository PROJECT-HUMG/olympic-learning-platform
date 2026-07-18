package me.nghlong3004.olympic.common.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/16/2026
 */
@ConfigurationProperties(prefix = "olympic.client")
public record ClientProperties(String baseUrl) {

  public ClientProperties {
    if (baseUrl == null || baseUrl.isBlank() || baseUrl.startsWith("${")) {
      baseUrl = "http://localhost:3000";
    }
  }
}
