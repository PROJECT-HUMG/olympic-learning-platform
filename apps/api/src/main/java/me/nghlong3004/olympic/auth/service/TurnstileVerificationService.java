package me.nghlong3004.olympic.auth.service;

import me.nghlong3004.olympic.auth.enums.TurnstileAction;

/**
 * Gate for Turnstile-protected auth requests.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public interface TurnstileVerificationService {

  /**
   * Verifies a Turnstile token before any account or mail side effect. When Turnstile is disabled
   * this method returns without calling the provider. When it is enabled, a missing token, a
   * failed verdict, a hostname outside the allowlist, or an unexpected action is rejected. Provider
   * timeout, HTTP failure, a malformed body, and provider internal errors fail closed as retryable
   * unavailability. The token and secret are never logged.
   *
   * @param token client token, optional while Turnstile is disabled, at most 2048 characters
   * @param action expected siteverify action
   */
  void verify(String token, TurnstileAction action);
}
