package me.nghlong3004.olympic.group.service.impl;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.group.entity.AccountabilityGroup;
import me.nghlong3004.olympic.group.entity.AccountabilityGroupMembership;
import me.nghlong3004.olympic.group.entity.AccountabilityGroupShareViewer;
import me.nghlong3004.olympic.group.enums.MembershipStatus;
import me.nghlong3004.olympic.group.enums.SharingMode;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupMembershipRepository;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupRepository;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupShareViewerRepository;
import me.nghlong3004.olympic.group.service.GroupMembershipService;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GroupMembershipServiceImpl implements GroupMembershipService {
  private static final int MAX_NAME_LENGTH = 120;

  private final AccountabilityGroupRepository groups;
  private final AccountabilityGroupMembershipRepository memberships;
  private final AccountabilityGroupShareViewerRepository viewers;
  private final UserRepository users;
  private final Clock clock;

  @Transactional
  @Override
  public AccountabilityGroup createGroup(UUID ownerUserId, String name) {
    var owner = requireUser(ownerUserId);
    var now = now();
    var group =
        groups.saveAndFlush(
            AccountabilityGroup.builder()
                .owner(owner)
                .name(requireName(name))
                .createdAt(now)
                .updatedAt(now)
                .build());
    saveNewMembership(group, owner, now);
    log.info("Accountability group created: groupId={} ownerId={}", group.getId(), owner.getId());
    return group;
  }

  @Transactional
  @Override
  public AccountabilityGroupMembership recordAcceptedMember(UUID groupId, UUID userId) {
    var group = requireGroup(groupId);
    var user = requireUser(userId);
    if (memberships.existsByGroup_IdAndUser_Id(group.getId(), user.getId())) {
      throw ErrorCode.DUPLICATE_RESOURCE.throwIt("User is already a member of this group");
    }
    var membership = saveNewMembership(group, user, now());
    log.info(
        "Accepted accountability member recorded: groupId={} userId={}",
        group.getId(),
        user.getId());
    return membership;
  }

  @Transactional
  @Override
  public AccountabilityGroupMembership updateOwnShare(
      UUID groupId, UUID actorId, boolean shareDaily, SharingMode sharingMode) {
    if (sharingMode == null) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Sharing mode is required");
    }
    var membership = requireMembership(groupId, actorId);
    membership.setShareDaily(shareDaily);
    membership.setSharingMode(sharingMode);
    membership.setUpdatedAt(now());
    log.info(
        "Accountability share updated: groupId={} actorId={} shareDaily={} sharingMode={}",
        groupId,
        actorId,
        shareDaily,
        sharingMode);
    return memberships.save(membership);
  }

  @Transactional
  @Override
  public AccountabilityGroupShareViewer setSelectedViewer(
      UUID groupId, UUID actorId, UUID viewerId, boolean active) {
    if (actorId != null && actorId.equals(viewerId)) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("A member cannot select themselves");
    }
    var actor = requireMembership(groupId, actorId);
    var viewer = requireMembership(groupId, viewerId);
    var now = now();
    var selection =
        viewers
            .findByOwner_IdAndGroup_IdAndViewer_Id(actorId, groupId, viewerId)
            .orElseGet(
                () ->
                    AccountabilityGroupShareViewer.builder()
                        .owner(actor.getUser())
                        .group(actor.getGroup())
                        .viewer(viewer.getUser())
                        .createdAt(now)
                        .build());
    selection.setActive(active);
    selection.setUpdatedAt(now);
    log.info(
        "Accountability viewer selection updated: groupId={} actorId={} viewerId={} active={}",
        groupId,
        actorId,
        viewerId,
        active);
    return viewers.save(selection);
  }

  @Transactional
  @Override
  public AccountabilityGroupMembership changeOwnStatus(
      UUID groupId, UUID userId, MembershipStatus status) {
    if (status == null) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Membership status is required");
    }
    var membership = requireMembership(groupId, userId);
    membership.setStatus(status);
    membership.setUpdatedAt(now());
    log.info(
        "Accountability membership status updated: groupId={} userId={} status={}",
        groupId,
        userId,
        status);
    return memberships.save(membership);
  }

  private AccountabilityGroupMembership saveNewMembership(
      AccountabilityGroup group, User user, OffsetDateTime now) {
    return memberships.save(
        AccountabilityGroupMembership.builder()
            .group(group)
            .user(user)
            .status(MembershipStatus.ACTIVE)
            .shareDaily(false)
            .sharingMode(SharingMode.GROUP)
            .createdAt(now)
            .updatedAt(now)
            .build());
  }

  private AccountabilityGroup requireGroup(UUID groupId) {
    if (groupId == null) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Group is required");
    }
    return groups
        .findById(groupId)
        .orElseThrow(() -> ErrorCode.RESOURCE_NOT_FOUND.throwIt("Accountability group not found"));
  }

  private User requireUser(UUID userId) {
    if (userId == null) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("User is required");
    }
    return users.findById(userId).orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);
  }

  private AccountabilityGroupMembership requireMembership(UUID groupId, UUID userId) {
    if (groupId == null || userId == null) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Group and user are required");
    }
    return memberships
        .findByGroup_IdAndUser_Id(groupId, userId)
        .orElseThrow(
            () ->
                ErrorCode.RESOURCE_NOT_FOUND.throwIt("Accountability group membership not found"));
  }

  private String requireName(String name) {
    var trimmed = name == null ? "" : name.trim();
    if (trimmed.isEmpty()) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Group name is required");
    }
    if (trimmed.length() > MAX_NAME_LENGTH) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Group name is too long");
    }
    return trimmed;
  }

  private OffsetDateTime now() {
    return OffsetDateTime.now(clock);
  }
}
