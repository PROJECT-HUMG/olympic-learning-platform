package me.nghlong3004.olympic.user.service.impl;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.auth.response.CurrentUserResponse;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.properties.UserProperties;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.mapper.UserMapper;
import me.nghlong3004.olympic.user.repository.UserRepository;
import me.nghlong3004.olympic.user.request.UpdateProfileRequest;
import me.nghlong3004.olympic.user.response.UserResponse;
import me.nghlong3004.olympic.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

  private final UserRepository userRepository;
  private final UserMapper userMapper;
  private final CurrentUserProvider currentUserProvider;
  private final UserProperties userProperties;

  @Override
  public CurrentUserResponse me() {
    CurrentUser currentUser = currentUserProvider.getCurrentUser();

    User user =
        userRepository
            .findByIdAndDeletedAtIsNull(currentUser.id())
            .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);

    return userMapper.toCurrentUserResponse(user);
  }

  @Override
  public UserResponse findById(UUID userId) {

    User user =
        userRepository
            .findByIdAndDeletedAtIsNull(userId)
            .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);

    return userMapper.toResponse(user);
  }

  @Override
  @Transactional
  public UserResponse updateProfile(UpdateProfileRequest request) {
    CurrentUser currentUser = currentUserProvider.getCurrentUser();

    User user =
        userRepository
            .findForUpdateById(currentUser.id())
            .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);

    user.setFullName(request.fullName());

    log.info("User {} updated profile", user.getId());

    return userMapper.toResponse(user);
  }

  @Override
  @Transactional
  public UserResponse updateAvatar(MultipartFile avatar) {

    throw new UnsupportedOperationException("Avatar upload is not implemented yet.");
  }

  @Override
  @Transactional
  public UserResponse removeAvatar() {
    CurrentUser currentUser = currentUserProvider.getCurrentUser();

    User user =
        userRepository
            .findForUpdateById(currentUser.id())
            .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);

    user.setAvatarUrl(userProperties.defaultAvatarUrl());

    log.info("User {} removed avatar", user.getId());

    return userMapper.toResponse(user);
  }
}
