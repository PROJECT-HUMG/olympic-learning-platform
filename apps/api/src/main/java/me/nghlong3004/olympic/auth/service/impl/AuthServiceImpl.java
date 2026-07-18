package me.nghlong3004.olympic.auth.service.impl;

import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.auth.enums.AuthEmailTokenPurpose;
import me.nghlong3004.olympic.auth.mapper.AuthMapper;
import me.nghlong3004.olympic.auth.request.RegisterRequest;
import me.nghlong3004.olympic.auth.response.RegisterResponse;
import me.nghlong3004.olympic.auth.service.AuthEmailTokenService;
import me.nghlong3004.olympic.auth.service.AuthService;
import me.nghlong3004.olympic.auth.service.RefreshTokenService;
import me.nghlong3004.olympic.auth.service.TokenService;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.mail.event.MailSendEvent;
import me.nghlong3004.olympic.common.mail.model.EmailVerificationMailModel;
import me.nghlong3004.olympic.common.properties.AuthProperties;
import me.nghlong3004.olympic.common.properties.UserProperties;
import me.nghlong3004.olympic.common.util.AuthLinkBuilder;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/18/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

  private static final String FORGOT_PASSWORD_MESSAGE =
      "If the email exists, reset instructions have been sent.";

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final TokenService jwtTokenService;
  private final RefreshTokenService refreshTokenService;
  private final AuthEmailTokenService authEmailTokenService;
  private final ApplicationEventPublisher eventPublisher;
  private final AuthProperties authProperties;
  private final UserProperties userProperties;
  private final AuthLinkBuilder linkBuilder;
  private final AuthMapper authMapper;
  private final Clock clock;

  @Transactional
  @Override
  public RegisterResponse register(RegisterRequest request, String ip, String userAgent) {
    if (authProperties.registration().mode() != AuthProperties.RegistrationMode.SELF_VERIFY) {
      throw ErrorCode.REGISTRATION_DISABLED.throwIt();
    }
    var email = normalizeEmail(request.email());
    if (userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull(email)) {
      throw ErrorCode.DUPLICATE_RESOURCE.throwIt("Email already exists");
    }
    var now = OffsetDateTime.now(clock);
    var user =
        userRepository.save(
            User.builder()
                .email(email)
                .username(request.username().trim())
                .fullName(request.fullName().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .avatarUrl(userProperties.defaultAvatarUrl())
                .role(Role.STUDENT)
                .status(Status.PENDING)
                .createdAt(now)
                .updatedAt(now)
                .build());
    var token =
        authEmailTokenService.issue(
            user,
            AuthEmailTokenPurpose.EMAIL_VERIFICATION,
            Duration.ofMinutes(authProperties.emailToken().verificationExpirationMinutes()),
            ip,
            userAgent);
    eventPublisher.publishEvent(
        new MailSendEvent(
            new EmailVerificationMailModel(
                user.getEmail(), user.getFullName(), linkBuilder.verificationLink(token.token()))));
    log.info("User registration accepted: userId={}", user.getId());
    return new RegisterResponse(
        user.getId(),
        user.getEmail(),
        user.getStatus(),
        "Registration accepted. Verify your email to activate the account.");
  }

  @Transactional
  @Override
  public LoginResult login(LoginRequest request, String ip, String userAgent) {
    var normalizedEmail = normalizeEmail(request.email());

    var user =
        userRepository
            .findByEmailIgnoreCaseAndDeletedAtIsNull(normalizedEmail)
            .orElseThrow(ErrorCode.INVALID_CREDENTIALS::throwIt);

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw ErrorCode.INVALID_CREDENTIALS.throwIt();
    }

    if (user.getStatus() == UserStatus.PENDING_EMAIL_VERIFICATION) {
      throw ErrorCode.EMAIL_NOT_VERIFIED.throwIt();
    }

    if (!user.active()) {
      throw ErrorCode.USER_DISABLED.throwIt();
    }

    if (passwordEncoder.upgradeEncoding(user.getPasswordHash())) {
      user.setPasswordHash(passwordEncoder.encode(request.password()));
    }

    var refreshToken = refreshTokenService.issue(user, ip, userAgent);

    var response =
        new LoginResponse(
            jwtTokenService.issueAccessToken(user),
            "Bearer",
            jwtTokenService.accessExpiresInSeconds(),
            authMapper.toCurrentUserResponse(user));

    log.info("User login succeeded: userId={}", user.getId());

    return new LoginResult(response, refreshToken);
  }

  @Transactional
  @Override
  public RefreshResult refresh(String refreshToken, String ip, String userAgent) {
    var rotation = refreshTokenService.rotate(refreshToken);
    var user = rotation.user();

    if (user.getDeletedAt() != null) {
      throw ErrorCode.USER_DISABLED.throwIt();
    }

    if (user.getStatus() == UserStatus.PENDING_EMAIL_VERIFICATION) {
      throw ErrorCode.EMAIL_NOT_VERIFIED.throwIt();
    }

    if (!user.active()) {
      throw ErrorCode.USER_DISABLED.throwIt();
    }

    var newRefreshToken = refreshTokenService.issue(user, rotation.familyId(), ip, userAgent);

    log.info("Access token refreshed: userId={}", user.getId());

    return new RefreshResult(
        new RefreshAccessTokenResponse(
            jwtTokenService.issueAccessToken(user),
            "Bearer",
            jwtTokenService.accessExpiresInSeconds()),
        newRefreshToken);
  }

  @Transactional
  @Override
  public AuthMessageResponse verifyEmail(VerifyEmailRequest request) {
    var user =
        authEmailTokenService.consume(
            request.token(), Set.of(AuthEmailTokenPurpose.EMAIL_VERIFICATION));
    if (user.getDeletedAt() != null || user.getStatus() == UserStatus.DISABLED) {
      throw ErrorCode.USER_DISABLED.throwIt();
    }
    if (user.getStatus() == UserStatus.PENDING_EMAIL_VERIFICATION) {
      user.setStatus(UserStatus.ACTIVE);
      user.setUpdatedAt(OffsetDateTime.now(clock));
    }
    userOnboardingService.ensurePersonalWorkspace(user);
    log.info("User email verified: userId={}", user.getId());
    return new AuthMessageResponse("Email verified.");
  }

  @Transactional
  @Override
  public AuthMessageResponse forgotPassword(
      ForgotPasswordRequest request, String ip, String userAgent) {
    userRepository
        .findByEmailIgnoreCaseAndDeletedAtIsNull(normalizeEmail(request.email()))
        .filter(AppUser::active)
        .ifPresent(user -> sendPasswordReset(user, ip, userAgent));
    return new AuthMessageResponse(FORGOT_PASSWORD_MESSAGE);
  }

  @Transactional
  @Override
  public AuthMessageResponse resetPassword(ResetPasswordRequest request) {
    var consumption =
        authEmailTokenService.consumeWithPurpose(
            request.token(),
            Set.of(AuthEmailTokenPurpose.PASSWORD_RESET, AuthEmailTokenPurpose.ADMIN_INVITE));
    var user = consumption.user();
    var purpose = consumption.purpose();

    if (user.getStatus() == UserStatus.DISABLED) {
      throw ErrorCode.USER_DISABLED.throwIt();
    }

    switch (purpose) {
      case PASSWORD_RESET -> {
        if (!user.active()) {
          throw ErrorCode.USER_DISABLED.throwIt();
        }
      }
      case ADMIN_INVITE -> user.setStatus(UserStatus.ACTIVE);
    }

    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setUpdatedAt(OffsetDateTime.now(clock));
    refreshTokenService.revokeActiveForUser(user.getId());
    authEmailTokenService.revokeActiveForUser(user.getId());
    if (consumption.purpose() == AuthEmailTokenPurpose.ADMIN_INVITE) {
      userOnboardingService.ensurePersonalWorkspace(user);
    }
    log.info("User password updated: userId={}, purpose={}", user.getId(), purpose);
    return new AuthMessageResponse("Password reset successfully.");
  }

  @Transactional(readOnly = true)
  @Override
  public CurrentUserResponse currentUser(CurrentUser currentUser) {
    var persistedUser =
        userRepository
            .findByIdAndDeletedAtIsNull(currentUser.id())
            .orElseThrow(ErrorCode.INVALID_CREDENTIALS::throwIt);

    if (persistedUser.getDeletedAt() != null) {
      throw ErrorCode.INVALID_CREDENTIALS.throwIt();
    }

    if (!persistedUser.active()) {
      throw ErrorCode.USER_DISABLED.throwIt();
    }

    return authMapper.toCurrentUserResponse(persistedUser);
  }

  private void sendPasswordReset(AppUser user, String ip, String userAgent) {
    var token =
        authEmailTokenService.issue(
            user,
            AuthEmailTokenPurpose.PASSWORD_RESET,
            Duration.ofMinutes(authProperties.emailToken().passwordResetExpirationMinutes()),
            ip,
            userAgent);
    eventPublisher.publishEvent(
        new MailSendEvent(
            new PasswordResetMailModel(
                user.getEmail(), user.getDisplayName(), linkBuilder.resetLink(token.token()))));
    log.info("Password reset email requested: userId={}", user.getId());
  }

  private String normalizeEmail(String email) {
    return AuthLinkBuilder.normalizeEmail(email);
  }
}
