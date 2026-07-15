package me.nghlong3004.olympic.common.config;

import me.nghlong3004.olympic.common.mail.MailProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
@Configuration
@EnableConfigurationProperties(MailProperties.class)
public class MailConfig {}
