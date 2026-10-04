package me.nghlong3004.olympic.group.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.group.entity.AccountabilityGroupMembership;
import me.nghlong3004.olympic.group.entity.AccountabilityGroupShareViewer;
import me.nghlong3004.olympic.group.enums.MembershipStatus;
import me.nghlong3004.olympic.group.enums.SharingMode;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupMembershipRepository;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupRepository;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupShareViewerRepository;
import me.nghlong3004.olympic.group.service.GroupDailyAccess;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Service
@RequiredArgsConstructor
public class GroupDailyAccessImpl implements GroupDailyAccess {
  private static final String DENIED = "Group sharing does not allow this viewer";

  private final AccountabilityGroupRepository groups;
  private final AccountabilityGroupMembershipRepository memberships;
  private final AccountabilityGroupShareViewerRepository viewers;

  @Transactional(readOnly = true)
  @Override
  public void requireViewer(UUID groupId, UUID ownerId, UUID viewerId) {
    requireIds(groupId, ownerId, viewerId);
    requireGroup(groupId);
    if (ownerId.equals(viewerId)) {
      return;
    }
    if (!sharedWith(groupId, ownerId, viewerId)) {
      throw ErrorCode.ACCESS_DENIED.throwIt(DENIED);
    }
  }

  @Transactional(readOnly = true)
  @Override
  public List<UUID> authorizedViewerIds(UUID groupId, UUID ownerId) {
    requireIds(groupId, ownerId, ownerId);
    requireGroup(groupId);
    var ids = new ArrayList<UUID>();
    ids.add(ownerId);
    var ownerMembership = memberships.findByGroup_IdAndUser_Id(groupId, ownerId).orElse(null);
    if (!sharingOn(ownerMembership)) {
      return List.copyOf(ids);
    }
    if (ownerMembership.getSharingMode() == SharingMode.GROUP) {
      for (var member : memberships.findByGroup_IdAndStatus(groupId, MembershipStatus.ACTIVE)) {
        var memberId = member.getUser().getId();
        if (!ownerId.equals(memberId)) {
          ids.add(memberId);
        }
      }
      return List.copyOf(ids);
    }
    for (var selection : viewers.findByOwner_IdAndGroup_IdAndActiveTrue(ownerId, groupId)) {
      var viewerId = selection.getViewer().getId();
      if (activeMember(groupId, viewerId)) {
        ids.add(viewerId);
      }
    }
    return List.copyOf(ids);
  }

  private boolean sharedWith(UUID groupId, UUID ownerId, UUID viewerId) {
    var ownerMembership = memberships.findByGroup_IdAndUser_Id(groupId, ownerId).orElse(null);
    if (!sharingOn(ownerMembership) || !activeMember(groupId, viewerId)) {
      return false;
    }
    if (ownerMembership.getSharingMode() == SharingMode.GROUP) {
      return true;
    }
    if (ownerMembership.getSharingMode() != SharingMode.SELECTED_MEMBERS) {
      return false;
    }
    return viewers
        .findByOwner_IdAndGroup_IdAndViewer_Id(ownerId, groupId, viewerId)
        .map(AccountabilityGroupShareViewer::isActive)
        .orElse(false);
  }

  private boolean sharingOn(AccountabilityGroupMembership membership) {
    return membership != null
        && membership.getStatus() == MembershipStatus.ACTIVE
        && membership.isShareDaily();
  }

  private boolean activeMember(UUID groupId, UUID userId) {
    return memberships
        .findByGroup_IdAndUser_Id(groupId, userId)
        .map(membership -> membership.getStatus() == MembershipStatus.ACTIVE)
        .orElse(false);
  }

  private void requireGroup(UUID groupId) {
    if (!groups.existsById(groupId)) {
      throw ErrorCode.RESOURCE_NOT_FOUND.throwIt("Accountability group not found");
    }
  }

  private static void requireIds(UUID groupId, UUID ownerId, UUID viewerId) {
    if (groupId == null || ownerId == null || viewerId == null) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Group, owner, and viewer are required");
    }
  }
}
