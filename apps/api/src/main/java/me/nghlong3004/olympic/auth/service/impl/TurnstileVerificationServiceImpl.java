package me.nghlong3004.olympic.auth.service.impl;

import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.auth.dto.TurnstileSiteverifyResponse;
import me.nghlong3004.olympic.auth.enums.TurnstileAction;
import me.nghlong3004.olympic.auth.service.TurnstileSiteverifyProvider;
import me.nghlong3004.olympic.auth.service.TurnstileVerificationService;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.properties.TurnstileProperties;
import org.springframework.stereotype.Service;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TurnstileVerificationServiceImpl implements TurnstileVerificationService {

  private final TurnstileProperties properties;
  private final TurnstileSiteverifyProvider turnstileSiteverifyProvider;

  @Override
  public void verify(String token, TurnstileAction action) {
    if (!properties.enabled()) {
      return;
    }
    if (token == null || token.isBlank() || token.length() > TurnstileProperties.MAX_TOKEN_LENGTH) {
      log.warn("Turnstile token rejected: reason=invalid action={}", action.action());
      throw ErrorCode.TURNSTILE_REJECTED.throwIt();
    }
    var response =
        callProvider(token, action);
    if (response.outage()) {
      log.warn("Turnstile verification unavailable: action={}", action.action());
      throw ErrorCode.TURNSTILE_UNAVAILABLE.throwIt();
    }
    if (!response.success() || !allowed(response.hostname()) || !action.action().equals(response.action())) {
      log.warn("Turnstile token rejected: action={}", action.action());
      throw ErrorCode.TURNSTILE_REJECTED.throwIt();
    }
  }

  private TurnstileSiteverifyResponse callProvider(String token, TurnstileAction action) {
    try {
      return turnstileSiteverifyProvider.siteverify(token);
    } catch (RuntimeException exception) {
      log.warn("Turnstile verification unavailable: action={}", action.action());
      throw ErrorCode.TURNSTILE_UNAVAILABLE.throwIt();
    }
  }

  private boolean allowed(String hostname) {
    if (hostname == null || hostname.isBlank()) {
      return false;
    }
    return properties.hostnames().contains(hostname.trim().toLowerCase(Locale.ROOT));
  }
}
