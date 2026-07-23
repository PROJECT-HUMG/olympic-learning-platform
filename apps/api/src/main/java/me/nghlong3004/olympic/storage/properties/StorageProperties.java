package me.nghlong3004.olympic.storage.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds the {@code olympic.storage.*} configuration namespace. Nested records carry
 * provider-specific credentials; only the record matching the active {@link #provider} is used at
 * runtime.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
@ConfigurationProperties(prefix = "olympic.storage")
public record StorageProperties(String provider, CloudinaryConfig cloudinary) {

  public record CloudinaryConfig(String cloudName, String apiKey, String apiSecret) {}
}
