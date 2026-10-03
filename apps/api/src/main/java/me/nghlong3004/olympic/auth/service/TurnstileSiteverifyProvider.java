package me.nghlong3004.olympic.auth.service;

import me.nghlong3004.olympic.auth.dto.TurnstileSiteverifyResponse;

/**
 * Calls the fixed Cloudflare Turnstile siteverify endpoint. Implementations must not log the
 * secret, token, request body, or response body.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public interface TurnstileSiteverifyProvider {

  /**
   * Exchanges one token with siteverify. The token is single-use at the provider, so this method
   * performs one attempt and does not retry.
   *
   * @param token client token already checked for presence and length
   * @return parsed verdict, or an unavailable result for timeout, HTTP failure, or a malformed body
   */
  TurnstileSiteverifyResponse siteverify(String token);
}
