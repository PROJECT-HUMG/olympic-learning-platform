package me.nghlong3004.olympic.common.security;

import static me.nghlong3004.olympic.common.security.SecurityEndpoints.API_PATH;

import java.util.List;
import me.nghlong3004.olympic.common.properties.ClientProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/2/2026
 */
@Configuration
public class CorsConfig {
  @Bean
  public CorsConfigurationSource corsConfigurationSource(ClientProperties clientProperties) {

    var configuration = new CorsConfiguration();

    configuration.setAllowedOrigins(List.of(clientProperties.baseUrl()));
    configuration.setAllowedMethods(
        List.of(
            HttpMethod.GET.name(),
            HttpMethod.POST.name(),
            HttpMethod.PUT.name(),
            HttpMethod.PATCH.name(),
            HttpMethod.DELETE.name(),
            HttpMethod.OPTIONS.name()));
    configuration.setAllowedHeaders(
        List.of(
            HttpHeaders.AUTHORIZATION,
            HttpHeaders.CONTENT_TYPE,
            HttpHeaders.ACCEPT,
            "X-XSRF-TOKEN",
            "X-Request-Id"));
    configuration.setExposedHeaders(List.of("X-Request-Id"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);

    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration(API_PATH, configuration);
    return source;
  }
}
