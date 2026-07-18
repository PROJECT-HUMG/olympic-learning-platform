package me.nghlong3004.olympic.common.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/18/2026
 */
@ConfigurationProperties(prefix = "olympic.user")
public record UserProperties(String defaultAvatarUrl) {

  public UserProperties {
    if (defaultAvatarUrl == null || defaultAvatarUrl.isBlank()) {
      defaultAvatarUrl =
          "https://ui-avatars.com/api/?name={name}&background=random&color=fff&size=128";
    }
  }
}
