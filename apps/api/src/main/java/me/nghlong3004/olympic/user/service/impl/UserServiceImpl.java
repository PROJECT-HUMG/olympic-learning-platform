package me.nghlong3004.olympic.user.service.impl;

import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.auth.response.CurrentUserResponse;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.properties.UserProperties;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.storage.dto.UploadedFile;
import me.nghlong3004.olympic.storage.entity.FileEntity;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.service.StorageService;
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

  private static final Set<String> ALLOWED_AVATAR_TYPES =
      Set.of("image/jpeg", "image/png", "image/webp");
  private static final long MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

  private final UserRepository userRepository;
  private final UserMapper userMapper;
  private final CurrentUserProvider currentUserProvider;
  private final UserProperties userProperties;
  private final StorageService storageService;
  private final FileRepository fileRepository;

  @Override
  public CurrentUserResponse me() {
    CurrentUser currentUser = currentUserProvider.getCurrentUser();

    User user =
        userRepository
            .findByIdAndDeletedAtIsNull(currentUser.id())
            .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);

    return userMapper.toCurrentUserResponse(user).withAvatarUrl(resolveAvatarUrl(user));
  }

  @Override
  public UserResponse findById(UUID userId) {

    User user =
        userRepository
            .findByIdAndDeletedAtIsNull(userId)
            .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);

    return userMapper.toResponse(user).withAvatarUrl(resolveAvatarUrl(user));
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

    return userMapper.toResponse(user).withAvatarUrl(resolveAvatarUrl(user));
  }

  @Override
  @Transactional
  public UserResponse updateAvatar(MultipartFile avatar) {
    validateAvatar(avatar);

    CurrentUser currentUser = currentUserProvider.getCurrentUser();

    User user =
        userRepository
            .findForUpdateById(currentUser.id())
            .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);

    deleteOldAvatar(user);

    UploadedFile uploaded = storageService.upload(avatar, StorageFolder.AVATAR);

    var fileEntity =
        fileRepository.save(
            FileEntity.builder()
                .storageKey(uploaded.storageKey())
                .originalName(uploaded.originalName())
                .contentType(uploaded.contentType())
                .size(uploaded.size())
                .provider(uploaded.provider().name())
                .folder(StorageFolder.AVATAR.name())
                .build());

    user.setAvatar(fileEntity);

    log.info("User {} updated avatar: fileId={}", user.getId(), fileEntity.getId());

    return userMapper.toResponse(user).withAvatarUrl(resolveAvatarUrl(user));
  }

  @Override
  @Transactional
  public UserResponse removeAvatar() {
    CurrentUser currentUser = currentUserProvider.getCurrentUser();

    User user =
        userRepository
            .findForUpdateById(currentUser.id())
            .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);

    deleteOldAvatar(user);

    user.setAvatar(null);

    log.info("User {} removed avatar", user.getId());

    return userMapper.toResponse(user).withAvatarUrl(resolveAvatarUrl(user));
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private String resolveAvatarUrl(User user) {
    if (user.getAvatar() != null) {
      return storageService.getPublicUrl(user.getAvatar().getStorageKey());
    }
    return userProperties.defaultAvatarUrl();
  }

  private void deleteOldAvatar(User user) {
    if (user.getAvatar() != null) {
      storageService.delete(user.getAvatar().getStorageKey());
      fileRepository.delete(user.getAvatar());
      log.info("Deleted old avatar: fileId={}", user.getAvatar().getId());
    }
  }

  private void validateAvatar(MultipartFile avatar) {
    if (avatar.isEmpty()) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Avatar file is empty");
    }
    if (avatar.getSize() > MAX_AVATAR_SIZE) {
      throw ErrorCode.FILE_TOO_LARGE.throwIt("Avatar must be less than 5MB");
    }
    if (!ALLOWED_AVATAR_TYPES.contains(avatar.getContentType())) {
      throw ErrorCode.FILE_TYPE_NOT_ALLOWED.throwIt(
          "Allowed types: " + String.join(", ", ALLOWED_AVATAR_TYPES));
    }
  }
}
