package me.nghlong3004.olympic.group.service.impl;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.group.dto.GroupAvatarBytes;
import me.nghlong3004.olympic.group.entity.AccountabilityGroup;
import me.nghlong3004.olympic.group.entity.GroupAvatar;
import me.nghlong3004.olympic.group.mapper.GroupMapper;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupRepository;
import me.nghlong3004.olympic.group.repository.GroupAvatarRepository;
import me.nghlong3004.olympic.group.request.UpdateGroupAvatarCropRequest;
import me.nghlong3004.olympic.group.response.GroupAvatarResponse;
import me.nghlong3004.olympic.group.service.GroupAvatarService;
import me.nghlong3004.olympic.group.service.GroupService;
import me.nghlong3004.olympic.question.service.impl.QuestionFigurePolicy;
import me.nghlong3004.olympic.user.entity.AvatarCrop;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Reuses the platform's bounded raster gate and profile framing. Images remain private in the DB.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GroupAvatarServiceImpl implements GroupAvatarService {
  private final GroupService access;
  private final CurrentUserProvider current;
  private final AccountabilityGroupRepository groups;
  private final GroupAvatarRepository avatars;
  private final QuestionFigurePolicy raster;
  private final GroupMapper mapper;
  private final Clock clock;

  @Transactional
  @Override
  public GroupAvatarResponse upload(UUID groupId, MultipartFile image, UpdateGroupAvatarCropRequest crop) {
    var group = founder(groupId);
    var framing = framing(crop);
    var accepted = raster.read(image);
    var id = UUID.randomUUID();
    avatars.save(GroupAvatar.builder().groupId(groupId).avatarId(id)
        .mediaType(accepted.contentType()).content(accepted.content()).build());
    group.setAvatarId(id);
    group.setAvatarCrop(framing);
    group.setUpdatedAt(OffsetDateTime.now(clock));
    log.info("Group avatar saved: groupId={} avatarId={}", groupId, id);
    return mapper.toAvatar(group);
  }

  @Transactional
  @Override
  public GroupAvatarResponse crop(UUID groupId, UUID avatarId, UpdateGroupAvatarCropRequest crop) {
    var group = founder(groupId);
    requireImage(group, avatarId);
    group.setAvatarCrop(framing(crop));
    group.setUpdatedAt(OffsetDateTime.now(clock));
    log.info("Group avatar framing saved: groupId={}", groupId);
    return mapper.toAvatar(group);
  }

  @Transactional
  @Override
  public void remove(UUID groupId, UUID avatarId) {
    var group = founder(groupId);
    requireImage(group, avatarId);
    avatars.deleteById(groupId);
    group.setAvatarId(null);
    group.setAvatarCrop(null);
    group.setUpdatedAt(OffsetDateTime.now(clock));
    log.info("Group avatar removed: groupId={}", groupId);
  }

  @Transactional(readOnly = true)
  @Override
  public GroupAvatarBytes read(UUID groupId, UUID avatarId) {
    access.detail(groupId); // Live account and active membership, not the role or an old cache.
    var image = avatars.findById(groupId).filter(row -> row.getAvatarId().equals(avatarId))
        .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    return new GroupAvatarBytes(image.getMediaType(), image.getContent());
  }

  private AccountabilityGroup founder(UUID groupId) {
    var group = groups.findForUpdateById(groupId).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    var detail = access.detail(groupId);
    if (!detail.ownerId().equals(current.getCurrentUser().id())) throw ErrorCode.ACCESS_DENIED.throwIt();
    return group;
  }

  private void requireImage(AccountabilityGroup group, UUID id) {
    if (id == null || !id.equals(group.getAvatarId())) throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt();
  }

  private AvatarCrop framing(UpdateGroupAvatarCropRequest crop) {
    if (crop == null || crop.x() == null || crop.y() == null || crop.zoom() == null
        || !Double.isFinite(crop.x()) || !Double.isFinite(crop.y()) || !Double.isFinite(crop.zoom())
        || crop.x() < 0 || crop.x() > 1 || crop.y() < 0 || crop.y() > 1
        || crop.zoom() < 1 || crop.zoom() > 3) throw ErrorCode.VALIDATION_ERROR.throwIt();
    return new AvatarCrop(crop.x(), crop.y(), crop.zoom());
  }
}
