package me.nghlong3004.olympic;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@SpringBootTest(
    properties = {
      "spring.profiles.active=dev",
      "olympic.client.base-url=http://localhost:3000",
      "olympic.mail.enabled=false"
    })
@Testcontainers(disabledWithoutDocker = true)
class OlympicApplicationTests {
  @Container
  @ServiceConnection
  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");

  @Test
  void contextLoads() {}
}
