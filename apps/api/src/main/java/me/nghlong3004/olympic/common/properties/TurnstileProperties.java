package me.nghlong3004.olympic.common.properties;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Turnstile configuration. An enabled deployment with a missing secret or allowlist fails during
 * binding instead of disabling the check or substituting a credential.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@ConfigurationProperties(prefix = "olympic.turnstile")
public record TurnstileProperties(
    boolean enabled, String secretKey, String allowedHostnames, Duration timeout) {

  public static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(2);
  public static final Duration MIN_TIMEOUT = Duration.ofSeconds(1);
  public static final Duration MAX_TIMEOUT = Duration.ofSeconds(10);
  public static final int MAX_TOKEN_LENGTH = 2048;

  private static final Pattern BARE_HOSTNAME =
      Pattern.compile(
          "^(?=.{1,253}$)[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$");

  public TurnstileProperties {
    secretKey = secretKey == null ? "" : secretKey.trim();
    var hostnames = parseHostnames(allowedHostnames);
    allowedHostnames = String.join(",", hostnames);
    if (timeout == null) {
      timeout = DEFAULT_TIMEOUT;
    }
    if (timeout.compareTo(MIN_TIMEOUT) < 0 || timeout.compareTo(MAX_TIMEOUT) > 0) {
      throw new IllegalStateException("olympic.turnstile.timeout must be between 1 and 10 seconds");
    }
    if (enabled && secretKey.isEmpty()) {
      throw new IllegalStateException(
          "Turnstile is enabled but olympic.turnstile.secret-key (TURNSTILE_SECRET_KEY) is missing");
    }
    if (enabled && hostnames.isEmpty()) {
      throw new IllegalStateException(
          "Turnstile is enabled but olympic.turnstile.allowed-hostnames (TURNSTILE_ALLOWED_HOSTNAMES) is missing");
    }
  }

  /**
   * Bare hostnames accepted from siteverify, normalized for exact case-insensitive comparison.
   *
   * @return immutable allowlist, empty when unset
   */
  public List<String> hostnames() {
    if (allowedHostnames.isEmpty()) {
      return List.of();
    }
    return List.of(allowedHostnames.split(",", -1));
  }

  @Override
  public String toString() {
    return "TurnstileProperties[enabled="
        + enabled
        + ", secretKeySet="
        + !secretKey.isEmpty()
        + ", allowedHostnames="
        + allowedHostnames
        + ", timeout="
        + timeout
        + "]";
  }

  private static List<String> parseHostnames(String raw) {
    if (raw == null || raw.isBlank()) {
      return List.of();
    }
    var parsed = new ArrayList<String>();
    for (var part : raw.split(",", -1)) {
      var hostname = part.trim().toLowerCase(Locale.ROOT);
      if (hostname.isEmpty()) {
        continue;
      }
      if (!BARE_HOSTNAME.matcher(hostname).matches()) {
        throw new IllegalStateException(
            "olympic.turnstile.allowed-hostnames must be a comma-separated list of bare hostnames");
      }
      if (!parsed.contains(hostname)) {
        parsed.add(hostname);
      }
    }
    return List.copyOf(parsed);
  }
}
