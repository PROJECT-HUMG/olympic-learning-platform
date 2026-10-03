package me.nghlong3004.olympic.auth.service.impl;

import static me.nghlong3004.olympic.common.constant.MessageConstant.PASSWORD_RESET_SUCCESS_MESSAGE_KEY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.auth.dto.AuthEmailTokenConsumption;
import me.nghlong3004.olympic.auth.enums.AuthEmailTokenPurpose;
import me.nghlong3004.olympic.auth.enums.TurnstileAction;
import me.nghlong3004.olympic.auth.request.ForgotPasswordRequest;
import me.nghlong3004.olympic.auth.request.RegisterRequest;
import me.nghlong3004.olympic.auth.request.ResetPasswordRequest;
import me.nghlong3004.olympic.auth.service.AuthEmailTokenService;
import me.nghlong3004.olympic.auth.service.RefreshTokenService;
import me.nghlong3004.olympic.auth.service.RegistrationVerificationService;
import me.nghlong3004.olympic.auth.service.TokenService;
import me.nghlong3004.olympic.auth.service.TurnstileVerificationService;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.properties.AuthProperties;
import me.nghlong3004.olympic.common.properties.UserProperties;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.common.util.AuthLinkBuilder;
import me.nghlong3004.olympic.auth.mapper.AuthMapper;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceImplTurnstileTest {

  private static final String TOKEN = "sample-token";

  @Mock private UserRepository userRepository;
  @Mock private PasswordEncoder passwordEncoder;
  @Mock private TokenService jwtTokenService;
  @Mock private RefreshTokenService refreshTokenService;
  @Mock private AuthEmailTokenService authEmailTokenService;
  @Mock private RegistrationVerificationService registrationVerificationService;
  @Mock private ApplicationEventPublisher eventPublisher;
  @Mock private AuthProperties authProperties;
  @Mock private UserProperties userProperties;
  @Mock private AuthLinkBuilder linkBuilder;
  @Mock private AuthMapper authMapper;
  @Mock private StorageService storageService;
  @Mock private CurrentUserProvider currentUserProvider;
  @Mock private TurnstileVerificationService turnstileVerificationService;

  private AuthServiceImpl authService;

  @BeforeEach
  void setUp() {
    authService =
        new AuthServiceImpl(
            userRepository,
            passwordEncoder,
            jwtTokenService,
            refreshTokenService,
            authEmailTokenService,
            registrationVerificationService,
            eventPublisher,
            authProperties,
            userProperties,
            linkBuilder,
            authMapper,
            storageService,
            currentUserProvider,
            Clock.fixed(Instant.parse("2026-10-03T00:00:00Z"), ZoneOffset.UTC),
            turnstileVerificationService);
  }

  @Test
  void registerRejectionAndOutageDoNotTouchAccountOrMail() {
    allowRegistration();
    var request = registration();
    doThrow(ErrorCode.TURNSTILE_REJECTED.throwIt())
        .doThrow(ErrorCode.TURNSTILE_UNAVAILABLE.throwIt())
        .when(turnstileVerificationService)
        .verify(TOKEN, TurnstileAction.REGISTER);

    assertError(ErrorCode.TURNSTILE_REJECTED, () -> authService.register(request, "127.0.0.1", "test"));
    assertError(
        ErrorCode.TURNSTILE_UNAVAILABLE, () -> authService.register(request, "127.0.0.1", "test"));

    verifyNoInteractions(
        userRepository,
        passwordEncoder,
        registrationVerificationService,
        eventPublisher,
        authEmailTokenService);
  }

  @Test
  void forgotPasswordRejectionAndOutageDoNotTouchAccountOrMail() {
    var request = new ForgotPasswordRequest("user@example.com", TOKEN);
    doThrow(ErrorCode.TURNSTILE_REJECTED.throwIt())
        .doThrow(ErrorCode.TURNSTILE_UNAVAILABLE.throwIt())
        .when(turnstileVerificationService)
        .verify(TOKEN, TurnstileAction.PASSWORD_RESET);

    assertError(
        ErrorCode.TURNSTILE_REJECTED,
        () -> authService.forgotPassword(request, "127.0.0.1", "test"));
    assertError(
        ErrorCode.TURNSTILE_UNAVAILABLE,
        () -> authService.forgotPassword(request, "127.0.0.1", "test"));

    verifyNoInteractions(userRepository, eventPublisher, authEmailTokenService, passwordEncoder);
  }

  @Test
  void registerChecksTurnstileBeforeAnyAccountLookup() {
    allowRegistration();
    when(userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull("user@example.com")).thenReturn(true);

    assertError(
        ErrorCode.DUPLICATE_RESOURCE,
        () -> authService.register(registration(), "127.0.0.1", "test"));

    var order = inOrder(turnstileVerificationService, userRepository);
    order.verify(turnstileVerificationService).verify(TOKEN, TurnstileAction.REGISTER);
    order.verify(userRepository).existsByEmailIgnoreCaseAndDeletedAtIsNull("user@example.com");
    verify(userRepository, never()).save(any());
    verifyNoInteractions(registrationVerificationService, eventPublisher, authEmailTokenService);
  }

  @Test
  void forgotPasswordChecksTurnstileBeforeAnyAccountLookup() {
    when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("user@example.com"))
        .thenReturn(Optional.empty());

    var response =
        authService.forgotPassword(
            new ForgotPasswordRequest("user@example.com", TOKEN), "127.0.0.1", "test");

    assertThat(response.messageKey()).isEqualTo("success.auth.forgotPassword");
    var order = inOrder(turnstileVerificationService, userRepository);
    order.verify(turnstileVerificationService).verify(TOKEN, TurnstileAction.PASSWORD_RESET);
    order.verify(userRepository).findByEmailIgnoreCaseAndDeletedAtIsNull("user@example.com");
    verifyNoInteractions(eventPublisher, authEmailTokenService);
  }

  @Test
  void disabledRegistrationDoesNotConsumeATurnstileToken() {
    when(authProperties.registration())
        .thenReturn(new AuthProperties.Registration(AuthProperties.RegistrationMode.ADMIN_ONLY));

    assertError(
        ErrorCode.REGISTRATION_DISABLED,
        () -> authService.register(registration(), "127.0.0.1", "test"));

    verifyNoInteractions(
        turnstileVerificationService,
        userRepository,
        registrationVerificationService,
        eventPublisher,
        authEmailTokenService);
  }

  @Test
  void tokenResetDoesNotUseTurnstile() {
    var user =
        User.builder()
            .id(UUID.randomUUID())
            .email("user@example.com")
            .username("user")
            .fullName("Student")
            .status(Status.ACTIVE)
            .passwordHash("old")
            .build();
    when(authEmailTokenService.consumeWithPurpose(eq("reset-token"), any()))
        .thenReturn(new AuthEmailTokenConsumption(user, AuthEmailTokenPurpose.PASSWORD_RESET));
    when(passwordEncoder.encode("ChangeMe@123")).thenReturn("hashed");

    var response = authService.resetPassword(new ResetPasswordRequest("reset-token", "ChangeMe@123"));

    assertThat(response.messageKey()).isEqualTo(PASSWORD_RESET_SUCCESS_MESSAGE_KEY);
    verifyNoInteractions(turnstileVerificationService, eventPublisher);
  }

  @Test
  void registrationOtpServiceIsNotTurnstileGated() {
    assertThat(RegistrationVerificationServiceImpl.class.getDeclaredFields())
        .noneMatch(field -> field.getType().equals(TurnstileVerificationService.class));
  }

  private void allowRegistration() {
    when(authProperties.registration())
        .thenReturn(new AuthProperties.Registration(AuthProperties.RegistrationMode.SELF_VERIFY));
  }

  private static RegisterRequest registration() {
    return new RegisterRequest("user@example.com", "user", "Student", "ChangeMe@123", TOKEN);
  }

  private static void assertError(ErrorCode code, Runnable call) {
    assertThatThrownBy(call::run)
        .isInstanceOf(ApiException.class)
        .satisfies(thrown -> assertThat(((ApiException) thrown).getErrorCode()).isEqualTo(code));
  }
}
