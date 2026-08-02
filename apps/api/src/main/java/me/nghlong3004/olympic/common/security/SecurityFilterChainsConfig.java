package me.nghlong3004.olympic.common.security;

import static me.nghlong3004.olympic.common.security.SecurityEndpoints.*;

import jakarta.servlet.DispatcherType;
import me.nghlong3004.olympic.user.enums.Role;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityFilterChainsConfig {

  @Bean
  @Order(1)
  public SecurityFilterChain apiSecurity(
      HttpSecurity http,
      Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter,
      CorsConfigurationSource corsConfigurationSource,
      BearerTokenResolver bearerTokenResolver,
      BearerTokenAuthenticationEntryPoint authenticationEntryPoint,
      BearerTokenAccessDeniedHandler accessDeniedHandler) {

    return http.securityMatcher(API_PATH)
        .cors(cors -> cors.configurationSource(corsConfigurationSource))
        .csrf(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .logout(AbstractHttpConfigurer::disable)
        .requestCache(AbstractHttpConfigurer::disable)
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .exceptionHandling(
            exceptions ->
                exceptions
                    .authenticationEntryPoint(authenticationEntryPoint)
                    .accessDeniedHandler(accessDeniedHandler))
        .authorizeHttpRequests(
            authorization ->
                authorization
                    .requestMatchers(HttpMethod.GET, PUBLIC_GET_ENDPOINTS)
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, PUBLIC_POST_ENDPOINTS)
                    .permitAll()
                    .requestMatchers(ADMIN_PATH)
                    .hasRole(Role.ADMIN.name())
                    .anyRequest()
                    .authenticated())
        .oauth2ResourceServer(
            oauth2 ->
                oauth2
                    .bearerTokenResolver(bearerTokenResolver)
                    .authenticationEntryPoint(authenticationEntryPoint)
                    .accessDeniedHandler(accessDeniedHandler)
                    .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)))
        .build();
  }

  @Bean
  @Order(2)
  public SecurityFilterChain fallbackSecurity(HttpSecurity http) {

    return http.csrf(AbstractHttpConfigurer::disable)
        .cors(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .logout(AbstractHttpConfigurer::disable)
        .requestCache(AbstractHttpConfigurer::disable)
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            authorization ->
                authorization
                    .dispatcherTypeMatchers(DispatcherType.ERROR)
                    .permitAll()
                    .requestMatchers(PUBLIC_FALLBACK_ENDPOINTS)
                    .permitAll()
                    .anyRequest()
                    .denyAll())
        .build();
  }
}
