package me.nghlong3004.olympic.storage.config;

import com.cloudinary.Cloudinary;
import java.util.Map;
import me.nghlong3004.olympic.storage.properties.StorageProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers provider-specific beans guarded by {@code olympic.storage.provider}. When a different
 * provider value is configured, this entire configuration class is skipped, keeping the application
 * context free of unused SDK clients.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
@Configuration
@ConditionalOnProperty(name = "olympic.storage.provider", havingValue = "cloudinary")
public class StorageConfig {

  @Bean
  public Cloudinary cloudinary(StorageProperties props) {
    var cfg = props.cloudinary();
    return new Cloudinary(
        Map.of(
            "cloud_name", cfg.cloudName(),
            "api_key", cfg.apiKey(),
            "api_secret", cfg.apiSecret()));
  }
}
