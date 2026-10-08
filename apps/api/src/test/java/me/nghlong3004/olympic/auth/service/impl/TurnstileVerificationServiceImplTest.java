package me.nghlong3004.olympic.auth.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import java.util.List;
import me.nghlong3004.olympic.auth.dto.TurnstileSiteverifyResponse;
import me.nghlong3004.olympic.auth.enums.TurnstileAction;
import me.nghlong3004.olympic.auth.service.TurnstileSiteverifyProvider;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.properties.TurnstileProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@ExtendWith(MockitoExtension.class)
class TurnstileVerificationServiceImplTest {

  private static final String TOKEN = "sample-token";

  private final Logger logger =
      (Logger) LoggerFactory.getLogger(TurnstileVerificationServiceImpl.class);
  private final ListAppender<ILoggingEvent> logs = new ListAppender<>();

  @Mock private TurnstileProperties properties;
  @Mock private TurnstileSiteverifyProvider provider;

  private TurnstileVerificationServiceImpl service;

  @BeforeEach
  void setUp() {
    logs.start();
    logger.addAppender(logs);
    service = new TurnstileVerificationServiceImpl(properties, provider);
  }

  @AfterEach
  void tearDown() {
    logger.detachAppender(logs);
  }

  @Test
  void errorCodesUseTheContractStatusesAndMessageKeys() {
    assertThat(ErrorCode.TURNSTILE_REJECTED.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
    assertThat(ErrorCode.TURNSTILE_REJECTED.getMessageKey()).isEqualTo("error.auth.turnstileRejected");
    assertThat(ErrorCode.TURNSTILE_UNAVAILABLE.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
    assertThat(ErrorCode.TURNSTILE_UNAVAILABLE.getMessageKey())
        .isEqualTo("error.auth.turnstileUnavailable");
  }

  @Test
  void disabledConfigurationDoesNotCallTheProvider() {
    service.verify(TOKEN, TurnstileAction.REGISTER);
    service.verify(null, TurnstileAction.PASSWORD_RESET);
    service.verify(null, TurnstileAction.LOGIN);

    verifyNoInteractions(provider);
  }

  @Test
  void missingOrOversizedTokenIsRejectedWithoutAProviderCall() {
    when(properties.enabled()).thenReturn(true);

    assertRejected(() -> service.verify(null, TurnstileAction.REGISTER));
    assertRejected(() -> service.verify("   ", TurnstileAction.REGISTER));
    assertRejected(() -> service.verify("a".repeat(2049), TurnstileAction.PASSWORD_RESET));

    verifyNoInteractions(provider);
    assertLogsHideToken();
  }

  @Test
  void acceptsTrueSuccessForAnAllowedHostnameAndExactAction() {
    when(properties.enabled()).thenReturn(true);
    when(properties.hostnames()).thenReturn(List.of("app.example.com", "localhost"));
    when(provider.siteverify(TOKEN))
        .thenReturn(
            TurnstileSiteverifyResponse.verdict(true, "App.Example.com", "register", List.of()));

    service.verify(TOKEN, TurnstileAction.REGISTER);

    verify(provider).siteverify(TOKEN);
  }

  @Test
  void passwordResetRequiresItsOwnAction() {
    when(properties.enabled()).thenReturn(true);
    when(properties.hostnames()).thenReturn(List.of("app.example.com"));
    when(provider.siteverify(TOKEN))
        .thenReturn(
            TurnstileSiteverifyResponse.verdict(
                true, "app.example.com", "password_reset", List.of()));

    service.verify(TOKEN, TurnstileAction.PASSWORD_RESET);
    assertRejected(() -> service.verify(TOKEN, TurnstileAction.REGISTER));
  }

  @Test
  void loginRequiresItsOwnActionAndRejectsMissingOrReusedTokens() {
    when(properties.enabled()).thenReturn(true);
    when(properties.hostnames()).thenReturn(List.of("app.example.com"));
    assertRejected(() -> service.verify(null, TurnstileAction.LOGIN));
    assertRejected(() -> service.verify(" ", TurnstileAction.LOGIN));
    when(provider.siteverify(TOKEN))
        .thenReturn(TurnstileSiteverifyResponse.verdict(true, "app.example.com", "register", List.of()))
        .thenReturn(TurnstileSiteverifyResponse.verdict(true, "app.example.com", "password_reset", List.of()))
        .thenReturn(TurnstileSiteverifyResponse.verdict(true, "app.example.com", "login", List.of()))
        .thenReturn(TurnstileSiteverifyResponse.verdict(false, "app.example.com", "login", List.of("timeout-or-duplicate")))
        .thenReturn(TurnstileSiteverifyResponse.verdict(true, "other.example.com", "login", List.of()))
        .thenReturn(TurnstileSiteverifyResponse.unreachable());
    assertRejected(() -> service.verify(TOKEN, TurnstileAction.LOGIN));
    assertRejected(() -> service.verify(TOKEN, TurnstileAction.LOGIN));
    service.verify(TOKEN, TurnstileAction.LOGIN);
    assertRejected(() -> service.verify(TOKEN, TurnstileAction.LOGIN));
    assertRejected(() -> service.verify(TOKEN, TurnstileAction.LOGIN));
    assertUnavailable(() -> service.verify(TOKEN, TurnstileAction.LOGIN));
    assertLogsHideToken();
  }

  @Test
  void hostnameAndActionMismatchesAreRejected() {
    when(properties.enabled()).thenReturn(true);
    when(properties.hostnames()).thenReturn(List.of("app.example.com"));
    when(provider.siteverify(TOKEN))
        .thenReturn(
            TurnstileSiteverifyResponse.verdict(true, "evil.example.com", "register", List.of()))
        .thenReturn(
            TurnstileSiteverifyResponse.verdict(true, "www.app.example.com", "register", List.of()))
        .thenReturn(TurnstileSiteverifyResponse.verdict(true, "app.example.com", "login", List.of()))
        .thenReturn(TurnstileSiteverifyResponse.verdict(true, null, "register", List.of()))
        .thenReturn(
            TurnstileSiteverifyResponse.verdict(
                false, "app.example.com", "register", List.of("invalid-input-response")));

    for (var attempt = 0; attempt < 5; attempt++) {
      assertRejected(() -> service.verify(TOKEN, TurnstileAction.REGISTER));
    }
    assertLogsHideToken();
  }

  @Test
  void providerOutageIsRetryableAndDoesNotTreatTheTokenAsRejected() {
    when(properties.enabled()).thenReturn(true);
    when(provider.siteverify(TOKEN))
        .thenReturn(TurnstileSiteverifyResponse.unreachable())
        .thenThrow(new IllegalStateException(TOKEN));

    assertUnavailable(() -> service.verify(TOKEN, TurnstileAction.REGISTER));
    assertUnavailable(() -> service.verify(TOKEN, TurnstileAction.PASSWORD_RESET));
    assertLogsHideToken();
  }

  private void assertRejected(Runnable call) {
    assertThatThrownBy(call::run)
        .isInstanceOf(ApiException.class)
        .satisfies(
            thrown ->
                assertThat(((ApiException) thrown).getErrorCode())
                    .isEqualTo(ErrorCode.TURNSTILE_REJECTED));
  }

  private void assertUnavailable(Runnable call) {
    assertThatThrownBy(call::run)
        .isInstanceOf(ApiException.class)
        .satisfies(
            thrown ->
                assertThat(((ApiException) thrown).getErrorCode())
                    .isEqualTo(ErrorCode.TURNSTILE_UNAVAILABLE));
  }

  private void assertLogsHideToken() {
    assertThat(logs.list)
        .isNotEmpty()
        .allSatisfy(
            event -> {
              assertThat(event.getFormattedMessage()).doesNotContain(TOKEN);
              assertThat(event.getThrowableProxy()).isNull();
            });
  }

  @Test
  void acceptedTokenIsNotLogged() {
    when(properties.enabled()).thenReturn(true);
    when(properties.hostnames()).thenReturn(List.of("app.example.com"));
    when(provider.siteverify(TOKEN))
        .thenReturn(
            TurnstileSiteverifyResponse.verdict(true, "app.example.com", "register", List.of()));

    service.verify(TOKEN, TurnstileAction.REGISTER);

    verify(provider, never()).siteverify("other-token");
    assertThat(logs.list).allSatisfy(event -> assertThat(event.getFormattedMessage()).doesNotContain(TOKEN));
  }
}
