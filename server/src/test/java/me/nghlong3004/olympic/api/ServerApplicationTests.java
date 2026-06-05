package me.nghlong3004.olympic.api;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Integration test for Spring context loading.
 *
 * <p>Disabled until Testcontainers PostgreSQL setup is configured.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Disabled("Requires PostgreSQL — enable with Testcontainers")
@SpringBootTest
class ServerApplicationTests {

	@Test
	void contextLoads() {
	}

}
