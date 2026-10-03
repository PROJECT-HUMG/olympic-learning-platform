package me.nghlong3004.olympic.auth.dto;

import java.util.List;

/**
 * Parsed Turnstile siteverify payload. Transport and malformed results use {@link #unreachable()}.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public record TurnstileSiteverifyResponse(
    boolean success, String hostname, String action, List<String> errorCodes, boolean outage) {

  public TurnstileSiteverifyResponse {
    errorCodes = errorCodes == null ? List.of() : List.copyOf(errorCodes);
  }

  /**
   * Provider call could not be completed. Callers must fail closed with a retryable error.
   *
   * @return unavailable result
   */
  public static TurnstileSiteverifyResponse unreachable() {
    return new TurnstileSiteverifyResponse(false, null, null, List.of(), true);
  }

  /**
   * Well-formed siteverify verdict. Hostname and action may still be absent.
   *
   * @param success JSON boolean {@code success}
   * @param hostname hostname field, or null when absent
   * @param action action field, or null when absent
   * @param errorCodes provider error codes, never null
   * @return verdict result
   */
  public static TurnstileSiteverifyResponse verdict(
      boolean success, String hostname, String action, List<String> errorCodes) {
    return new TurnstileSiteverifyResponse(success, hostname, action, errorCodes, false);
  }
}
