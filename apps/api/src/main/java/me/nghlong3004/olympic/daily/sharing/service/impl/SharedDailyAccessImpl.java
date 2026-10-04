package me.nghlong3004.olympic.daily.sharing.service.impl;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.daily.sharing.service.SharedDailyAccess;
import me.nghlong3004.olympic.group.enums.MembershipStatus;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupMembershipRepository;
import me.nghlong3004.olympic.group.service.GroupDailyAccess;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Service
@RequiredArgsConstructor
public class SharedDailyAccessImpl implements SharedDailyAccess {
  private final CurrentUserProvider current;
  private final UserRepository users;
  private final AccountabilityGroupMembershipRepository members;
  private final GroupDailyAccess access;

  @Transactional(readOnly = true)
  @Override
  public User requireActor() {
    var user =
        users
            .findByIdAndDeletedAtIsNull(current.getCurrentUser().id())
            .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);
    user.requireActiveForAuth();
    return user;
  }

  @Transactional(readOnly = true)
  @Override
  public User requireDashboardViewer(UUID groupId) {
    var actor = requireActor();
    if (!member(groupId, actor.getId())) throw ErrorCode.RESOURCE_NOT_FOUND.throwIt();
    return actor;
  }

  @Transactional(readOnly = true)
  @Override
  public User requireSharedReader(UUID groupId, UUID ownerId) {
    var actor = requireDashboardViewer(groupId);
    if (!visibleTo(groupId, ownerId, actor.getId())) throw ErrorCode.ACCESS_DENIED.throwIt();
    return actor;
  }

  @Transactional(readOnly = true)
  @Override
  public boolean visibleTo(UUID groupId, UUID ownerId, UUID viewerId) {
    if (!member(groupId, ownerId) || !member(groupId, viewerId)) return false;
    // A denied row is normal dashboard/filter data, not a caught transactional exception.
    return access.authorizedViewerIds(groupId, ownerId).contains(viewerId);
  }

  private boolean member(UUID groupId, UUID userId) {
    return members
        .findByGroup_IdAndUser_Id(groupId, userId)
        .filter(
            m ->
                m.getStatus() == MembershipStatus.ACTIVE
                    && m.getUser().getDeletedAt() == null
                    && m.getUser().active())
        .isPresent();
  }
}
