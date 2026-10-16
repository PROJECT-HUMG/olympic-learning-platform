package me.nghlong3004.olympic.group.service.impl;

import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.daily.sharing.repository.DailyEntrySharingRepository;
import me.nghlong3004.olympic.group.entity.AccountabilityGroup;
import me.nghlong3004.olympic.group.entity.AccountabilityGroupMembership;
import me.nghlong3004.olympic.group.entity.GroupInvitation;
import me.nghlong3004.olympic.group.enums.MembershipStatus;
import me.nghlong3004.olympic.group.enums.SharingMode;
import me.nghlong3004.olympic.group.mapper.GroupMapper;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupMembershipRepository;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupRepository;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupShareViewerRepository;
import me.nghlong3004.olympic.group.repository.GroupInvitationRepository;
import me.nghlong3004.olympic.group.request.CreateGroupInvitationRequest;
import me.nghlong3004.olympic.group.request.CreateGroupRequest;
import me.nghlong3004.olympic.group.request.ReplaceGroupSharingRequest;
import me.nghlong3004.olympic.group.response.GroupDetailResponse;
import me.nghlong3004.olympic.group.response.GroupInvitationResponse;
import me.nghlong3004.olympic.group.response.GroupSharingResponse;
import me.nghlong3004.olympic.group.response.GroupSummaryResponse;
import me.nghlong3004.olympic.group.service.GroupMembershipService;
import me.nghlong3004.olympic.group.service.GroupService;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * All HTTP consent mutations serialize on the group row; internal foundation is not an HTTP join
 * API.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GroupServiceImpl implements GroupService {
  private final CurrentUserProvider current;
  private final UserRepository users;
  private final AccountabilityGroupRepository groups;
  private final AccountabilityGroupMembershipRepository members;
  private final AccountabilityGroupShareViewerRepository selections;
  private final GroupInvitationRepository invites;
  private final GroupMembershipService foundation;
  private final GroupMapper mapper;
  private final Clock clock;
  private final DailyEntrySharingRepository entryShares;
  private final EntityManager entityManager;

  @Transactional(readOnly = true)
  @Override
  public List<GroupSummaryResponse> list() {
    var actor = actor();
    return members.findByUser_IdAndStatus(actor.getId(), MembershipStatus.ACTIVE).stream()
        .map(m -> mapper.toSummary(m.getGroup()))
        .sorted((a, b) -> a.name().compareToIgnoreCase(b.name()))
        .toList();
  }

  @Transactional
  @Override
  public GroupSummaryResponse create(CreateGroupRequest request) {
    var actor = actor();
    if (request == null) throw invalid();
    return mapper.toSummary(foundation.createGroup(actor.getId(), request.name()));
  }

  @Transactional(readOnly = true)
  @Override
  public GroupDetailResponse detail(UUID groupId) {
    var actor = actor();
    var own = member(groupId, actor.getId());
    var group = own.getGroup();
    var active =
        members.findByGroup_IdAndStatus(groupId, MembershipStatus.ACTIVE).stream()
            .filter(m -> live(m.getUser()))
            .map(m -> mapper.toMember(m.getUser()))
            .sorted((a, b) -> a.displayName().compareToIgnoreCase(b.displayName()))
            .toList();
    return mapper.toDetail(group, active, settings(own));
  }

  @Transactional
  @Override
  public GroupSharingResponse replaceSharing(UUID groupId, ReplaceGroupSharingRequest request) {
    actor();
    throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt(
        "Share a dated Daily entry instead of granting ongoing access");
  }

  @Transactional
  @Override
  public void leave(UUID groupId) {
    var actor = actor();
    lock(groupId);
    var own = member(groupId, actor.getId());
    own.setStatus(MembershipStatus.INACTIVE);
    own.setShareDaily(false);
    own.setSharingMode(SharingMode.GROUP);
    own.setUpdatedAt(OffsetDateTime.now(clock));
    clearSelections(groupId, actor.getId());
    entryShares.deleteAll(entryShares.findMembershipGrants(groupId, actor.getId()));
    log.info("Group member left: groupId={} actorId={}", groupId, actor.getId());
  }

  @Transactional
  @Override
  public GroupInvitationResponse invite(UUID groupId, CreateGroupInvitationRequest request) {
    var actor = actor();
    var group = lock(groupId);
    requireFounder(group, actor.getId());
    var username = request == null || request.username() == null ? "" : request.username().trim();
    if (username.isEmpty() || username.length() > 64) throw invalid();
    var target =
        users
            .findByUsernameIgnoreCaseAndDeletedAtIsNull(username)
            .filter(GroupServiceImpl::live)
            .orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (target.getId().equals(actor.getId())) throw invalid();
    if (members
            .findByGroup_IdAndUser_Id(groupId, target.getId())
            .map(m -> m.getStatus() == MembershipStatus.ACTIVE)
            .orElse(false)
        || invites.existsByGroupIdAndTargetUserIdAndStatus(groupId, target.getId(), "PENDING")) {
      throw ErrorCode.DUPLICATE_RESOURCE.throwIt();
    }
    var stamp = OffsetDateTime.now(clock);
    var row =
        invites.saveAndFlush(
            GroupInvitation.builder()
                .groupId(groupId)
                .inviterId(actor.getId())
                .targetUserId(target.getId())
                .status("PENDING")
                .createdAt(stamp)
                .updatedAt(stamp)
                .build());
    log.info("Group invitation created: invitationId={} groupId={}", row.getId(), groupId);
    return invitation(row);
  }

  @Transactional(readOnly = true)
  @Override
  public List<GroupInvitationResponse> invitations() {
    var actor = actor();
    return invites.findByTargetUserIdAndStatusOrderByCreatedAtAsc(actor.getId(), "PENDING").stream()
        .filter(this::liveInvitation)
        .map(this::invitation)
        .toList();
  }

  @Transactional
  @Override
  public GroupSummaryResponse accept(UUID invitationId) {
    var actor = actor();
    var row = targetInvitation(invitationId, actor.getId());
    var group = lock(row.getGroupId());
    // Reload only after group lock so concurrent accept/decline sees the terminal status.
    entityManager.refresh(row);
    requireFounder(group, row.getInviterId());
    if ("ACCEPTED".equals(row.getStatus())) {
      member(group.getId(), actor.getId()); // Never re-grant a departed membership on replay.
      return mapper.toSummary(group);
    }
    if (!"PENDING".equals(row.getStatus())) throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt();
    var stamp = OffsetDateTime.now(clock);
    var own = members.findByGroup_IdAndUser_Id(group.getId(), actor.getId()).orElse(null);
    if (own != null && own.getStatus() == MembershipStatus.ACTIVE)
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt();
    if (own == null)
      own =
          AccountabilityGroupMembership.builder().group(group).user(actor).createdAt(stamp).build();
    own.setStatus(MembershipStatus.ACTIVE);
    own.setShareDaily(false);
    own.setSharingMode(SharingMode.GROUP);
    own.setUpdatedAt(stamp);
    members.saveAndFlush(own);
    clearSelections(group.getId(), actor.getId());
    row.setStatus("ACCEPTED");
    row.setUpdatedAt(stamp);
    log.info("Group invitation accepted: invitationId={} groupId={}", invitationId, group.getId());
    return mapper.toSummary(group);
  }

  @Transactional
  @Override
  public void decline(UUID invitationId) {
    var actor = actor();
    var row = targetInvitation(invitationId, actor.getId());
    lock(row.getGroupId());
    entityManager.refresh(row);
    if ("DECLINED".equals(row.getStatus())) return;
    if (!"PENDING".equals(row.getStatus())) throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt();
    row.setStatus("DECLINED");
    row.setUpdatedAt(OffsetDateTime.now(clock));
    log.info("Group invitation declined: invitationId={}", invitationId);
  }

  private User actor() {
    var user =
        users
            .findByIdAndDeletedAtIsNull(current.getCurrentUser().id())
            .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);
    user.requireActiveForAuth();
    return user;
  }

  private AccountabilityGroup lock(UUID groupId) {
    return groups.findForUpdateById(groupId).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
  }

  private AccountabilityGroupMembership member(UUID groupId, UUID userId) {
    return members
        .findByGroup_IdAndUser_Id(groupId, userId)
        .filter(m -> m.getStatus() == MembershipStatus.ACTIVE && live(m.getUser()))
        .orElseThrow(ErrorCode.ACCESS_DENIED::throwIt);
  }

  private void requireFounder(AccountabilityGroup group, UUID actorId) {
    if (!group.getOwner().getId().equals(actorId)) throw ErrorCode.ACCESS_DENIED.throwIt();
    member(group.getId(), actorId);
  }

  private GroupInvitation targetInvitation(UUID id, UUID actorId) {
    var row = invites.findById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    if (!actorId.equals(row.getTargetUserId())) throw ErrorCode.ACCESS_DENIED.throwIt();
    return row;
  }

  private boolean liveInvitation(GroupInvitation row) {
    var group = groups.findById(row.getGroupId()).orElse(null);
    return group != null
        && group.getOwner().getId().equals(row.getInviterId())
        && members
            .findByGroup_IdAndUser_Id(row.getGroupId(), row.getInviterId())
            .map(m -> m.getStatus() == MembershipStatus.ACTIVE && live(m.getUser()))
            .orElse(false);
  }

  private void clearSelections(UUID groupId, UUID userId) {
    for (var row : selections.findByGroup_Id(groupId)) {
      if (userId.equals(row.getOwner().getId()) || userId.equals(row.getViewer().getId())) {
        row.setActive(false);
        row.setUpdatedAt(OffsetDateTime.now(clock));
      }
    }
  }

  private GroupSharingResponse settings(AccountabilityGroupMembership own) {
    var ids =
        selections
            .findByOwner_IdAndGroup_IdAndActiveTrue(own.getUser().getId(), own.getGroup().getId())
            .stream()
            .filter(
                s ->
                    members
                        .findByGroup_IdAndUser_Id(own.getGroup().getId(), s.getViewer().getId())
                        .map(m -> m.getStatus() == MembershipStatus.ACTIVE && live(m.getUser()))
                        .orElse(false))
            .map(s -> s.getViewer().getId())
            .sorted()
            .toList();
    return mapper.toSharing(own, ids);
  }

  private GroupInvitationResponse invitation(GroupInvitation row) {
    var group =
        groups.findById(row.getGroupId()).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    var inviter =
        users.findById(row.getInviterId()).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    return mapper.toInvitation(row, group, inviter);
  }

  private static boolean live(User user) {
    return user != null && user.getDeletedAt() == null && user.active();
  }

  private static RuntimeException invalid() {
    return ErrorCode.VALIDATION_ERROR.throwIt("Invalid group consent data");
  }
}
