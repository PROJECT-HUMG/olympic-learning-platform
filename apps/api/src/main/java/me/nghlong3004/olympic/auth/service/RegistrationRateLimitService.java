package me.nghlong3004.olympic.auth.service;

import java.time.Duration;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
public interface RegistrationRateLimitService {
  /**
   * Atomically consumes a shared rate limit, independently of the caller's transaction.
   * @param key scoped operation and subject; stored only as a digest
   * @param maximum maximum accepted operations in the window
   * @param window fixed window duration
   */
  void consume(String key, int maximum, Duration window);
}
