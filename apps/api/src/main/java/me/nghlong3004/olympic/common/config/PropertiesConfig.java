package me.nghlong3004.olympic.common.config;

import me.nghlong3004.olympic.common.properties.AuthProperties;
import me.nghlong3004.olympic.common.properties.ClientProperties;
import me.nghlong3004.olympic.common.properties.SecurityProperties;
import me.nghlong3004.olympic.common.properties.UserProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/18/2026
 */
@Configuration
@EnableConfigurationProperties({
  AuthProperties.class,
  SecurityProperties.class,
  ClientProperties.class,
  UserProperties.class
})
public class PropertiesConfig {}
