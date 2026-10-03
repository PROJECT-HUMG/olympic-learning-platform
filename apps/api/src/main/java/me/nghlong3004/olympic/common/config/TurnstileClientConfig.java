package me.nghlong3004.olympic.common.config;

import java.net.http.HttpClient;
import me.nghlong3004.olympic.common.properties.TurnstileProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Configuration
public class TurnstileClientConfig {

  @Bean
  HttpClient turnstileHttpClient(TurnstileProperties properties) {
    return HttpClient.newBuilder()
        .connectTimeout(properties.timeout())
        .followRedirects(HttpClient.Redirect.NEVER)
        .build();
  }
}
