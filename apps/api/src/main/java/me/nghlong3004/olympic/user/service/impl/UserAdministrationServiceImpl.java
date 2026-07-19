package me.nghlong3004.olympic.user.service.impl;

import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.auth.enums.AuthEmailTokenPurpose;
import me.nghlong3004.olympic.auth.service.AuthEmailTokenService;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.mail.event.MailSendEvent;
import me.nghlong3004.olympic.common.mail.model.AdminInviteMailModel;
import me.nghlong3004.olympic.common.properties.AuthProperties;
import me.nghlong3004.olympic.common.properties.UserProperties;
import me.nghlong3004.olympic.common.util.AuthLinkBuilder;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.mapper.UserMapper;
import me.nghlong3004.olympic.user.repository.UserRepository;
import me.nghlong3004.olympic.user.request.AdminCreateUserRequest;
import me.nghlong3004.olympic.user.response.AdminCreateUserResponse;
import me.nghlong3004.olympic.user.service.UserAdministrationService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/19/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserAdministrationServiceImpl implements UserAdministrationService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthEmailTokenService authEmailTokenService;
  private final ApplicationEventPublisher eventPublisher;
  private final AuthProperties authProperties;
  private final UserProperties userProperties;
  private final AuthLinkBuilder linkBuilder;
  private final Clock clock;
  private final UserMapper userMapper;

  @Transactional
  @Override
  public AdminCreateUserResponse createUser(
      AdminCreateUserRequest request, String ip, String userAgent) {
    var email = AuthLinkBuilder.normalizeEmail(request.email());
    if (userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull(email)) {
      throw ErrorCode.DUPLICATE_RESOURCE.throwIt("Email already exists");
    }
    var now = OffsetDateTime.now(clock);
    var user =
        userRepository.save(
            User.builder()
                .email(email)
                .username(request.username())
                .fullName(request.fullName().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .avatarUrl(userProperties.defaultAvatarUrl())
                .role(request.role())
                .status(Status.ACTIVE)
                .createdAt(now)
                .updatedAt(now)
                .build());
    var token =
        authEmailTokenService.issue(
            user,
            AuthEmailTokenPurpose.ADMIN_INVITE,
            Duration.ofMinutes(authProperties.emailToken().verificationExpirationMinutes()),
            ip,
            userAgent);
    eventPublisher.publishEvent(
        new MailSendEvent(
            new AdminInviteMailModel(
                user.getEmail(), user.getFullName(), linkBuilder.inviteLink(token.token()))));
    log.info("Admin created user invite: userId={}", user.getId());
    return new AdminCreateUserResponse(
        userMapper.toResponse(user), "User created. Invite email sent.");
  }
}
