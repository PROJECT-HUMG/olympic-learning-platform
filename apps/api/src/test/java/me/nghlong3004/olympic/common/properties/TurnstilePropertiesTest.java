package me.nghlong3004.olympic.common.properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
class TurnstilePropertiesTest {
  @Configuration(proxyBeanMethods = false)
  @EnableConfigurationProperties(TurnstileProperties.class)
  static class BindingConfiguration {}

  @Test
  void enabledBindingFailsAtStartupWithoutRequiredSecret() {
    new ApplicationContextRunner().withUserConfiguration(BindingConfiguration.class)
        .withPropertyValues("olympic.turnstile.enabled=true", "olympic.turnstile.allowed-hostnames=localhost")
        .run(context -> {
          assertThat(context).hasFailed();
          assertThat(context.getStartupFailure()).hasRootCauseMessage(
              "Turnstile is enabled but olympic.turnstile.secret-key (TURNSTILE_SECRET_KEY) is missing");
        });
  }

  @Test
  void enabledBindingFailsAtStartupWithoutRequiredHostnames() {
    new ApplicationContextRunner().withUserConfiguration(BindingConfiguration.class)
        .withPropertyValues("olympic.turnstile.enabled=true", "olympic.turnstile.secret-key=fixture-secret")
        .run(context -> {
          assertThat(context).hasFailed();
          assertThat(context.getStartupFailure()).hasRootCauseMessage(
              "Turnstile is enabled but olympic.turnstile.allowed-hostnames (TURNSTILE_ALLOWED_HOSTNAMES) is missing");
        });
  }

  @Test
  void explicitlyConfiguredBindingSucceedsWithoutProviderCalls() {
    new ApplicationContextRunner().withUserConfiguration(BindingConfiguration.class)
        .withPropertyValues("olympic.turnstile.enabled=true", "olympic.turnstile.secret-key=fixture-secret",
            "olympic.turnstile.allowed-hostnames=localhost,127.0.0.1", "olympic.turnstile.timeout=2s")
        .run(context -> {
          assertThat(context).hasNotFailed();
          assertThat(context.getBean(TurnstileProperties.class).hostnames()).containsExactly("localhost", "127.0.0.1");
        });
  }

  @ParameterizedTest
  @ValueSource(strings = {"application.yaml", "application-dev.yaml", "application-prod.yaml"})
  void yamlDefaultsAreExplicitlyDisabled(String resource) throws Exception {
    try (var input = TurnstilePropertiesTest.class.getClassLoader().getResourceAsStream(resource)) {
      assertThat(input).isNotNull();
      var yaml = new String(input.readAllBytes(), StandardCharsets.UTF_8);
      assertThat(count(yaml, "${TURNSTILE_ENABLED:false}")).isEqualTo(1);
      assertThat(yaml).doesNotContain("TURNSTILE_ENABLED:true");
      assertThat(yaml).contains("${TURNSTILE_SECRET_KEY:}");
      assertThat(yaml).contains("${TURNSTILE_ALLOWED_HOSTNAMES:}");
      assertThat(yaml).contains("${TURNSTILE_TIMEOUT:2s}");
    }
  }

  @Test
  void disabledConfigurationDoesNotRequireSecretOrHostnames() {
    var properties = new TurnstileProperties(false, null, null, null);

    assertThat(properties.enabled()).isFalse();
    assertThat(properties.secretKey()).isEmpty();
    assertThat(properties.hostnames()).isEmpty();
    assertThat(properties.timeout()).isEqualTo(TurnstileProperties.DEFAULT_TIMEOUT);
  }

  @Test
  void enabledConfigurationKeepsSecretAndNormalizesHostnames() {
    var properties =
        new TurnstileProperties(
            true, "  sample-secret  ", " App.Example.com, localhost, app.example.com ", Duration.ofSeconds(2));

    assertThat(properties.enabled()).isTrue();
    assertThat(properties.secretKey()).isEqualTo("sample-secret");
    assertThat(properties.hostnames()).containsExactly("app.example.com", "localhost");
    assertThat(properties.toString()).doesNotContain("sample-secret");
  }

  @Test
  void enabledMissingSecretFailsWithoutSubstitutingOne() {
    assertThatThrownBy(() -> new TurnstileProperties(true, " ", "app.example.com", Duration.ofSeconds(2)))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("TURNSTILE_SECRET_KEY");
  }

  @Test
  void enabledMissingHostnamesFails() {
    assertThatThrownBy(() -> new TurnstileProperties(true, "sample-secret", " , ", Duration.ofSeconds(2)))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("TURNSTILE_ALLOWED_HOSTNAMES");
  }

  @ParameterizedTest
  @ValueSource(
      strings = {
        "https://app.example.com",
        "app.example.com/path",
        "app.example.com:443",
        "app.example.com?x=1",
        ".example.com",
        "-bad.com",
        "app.example.com."
      })
  void hostnamesMustBeBareNames(String raw) {
    assertThatThrownBy(() -> new TurnstileProperties(false, "", raw, Duration.ofSeconds(2)))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("bare hostnames");
  }

  @ParameterizedTest
  @MethodSource("timeoutsOutsideBounds")
  void timeoutOutsideBoundsFailsInsteadOfClamping(Duration timeout) {
    assertThatThrownBy(() -> new TurnstileProperties(false, "", "app.example.com", timeout))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("between 1 and 10 seconds");
  }

  @Test
  void timeoutBoundsAreInclusive() {
    assertThat(new TurnstileProperties(false, "", "", Duration.ofSeconds(1)).timeout())
        .isEqualTo(Duration.ofSeconds(1));
    assertThat(new TurnstileProperties(false, "", "", Duration.ofSeconds(10)).timeout())
        .isEqualTo(Duration.ofSeconds(10));
  }

  private static Stream<Arguments> timeoutsOutsideBounds() {
    return Stream.of(
        Arguments.of(Duration.ZERO),
        Arguments.of(Duration.ofMillis(999)),
        Arguments.of(Duration.ofSeconds(11)),
        Arguments.of(Duration.ofMinutes(1)));
  }

  private static int count(String text, String needle) {
    var found = 0;
    var from = 0;
    while (true) {
      var at = text.indexOf(needle, from);
      if (at < 0) {
        return found;
      }
      found++;
      from = at + needle.length();
    }
  }
}
