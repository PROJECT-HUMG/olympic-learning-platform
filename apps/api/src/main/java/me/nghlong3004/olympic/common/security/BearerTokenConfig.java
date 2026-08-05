package me.nghlong3004.olympic.common.security;

import static me.nghlong3004.olympic.common.security.SecurityEndpoints.PUBLIC_POST_ENDPOINTS;

import java.util.Arrays;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/2/2026
 */
@Configuration
public class BearerTokenConfig {
  @Bean
  public BearerTokenResolver bearerTokenResolver() {
    var defaultResolver = new DefaultBearerTokenResolver();

    return request -> {
      var method = request.getMethod();
      var path = request.getServletPath();

      if (HttpMethod.POST.matches(method)
          && Arrays.stream(PUBLIC_POST_ENDPOINTS)
              .anyMatch(endpoint -> endpoint.equalsIgnoreCase(path))) {
        return null;
      }

      return defaultResolver.resolve(request);
    };
  }

  @Bean
  public BearerTokenAuthenticationEntryPoint bearerTokenAuthenticationEntryPoint() {
    return new BearerTokenAuthenticationEntryPoint();
  }

  @Bean
  public BearerTokenAccessDeniedHandler bearerTokenAccessDeniedHandler() {
    return new BearerTokenAccessDeniedHandler();
  }
}
