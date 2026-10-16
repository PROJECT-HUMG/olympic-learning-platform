package me.nghlong3004.olympic.daily.sharing.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.TreeSet;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.daily.entity.DailyPlan;
import me.nghlong3004.olympic.daily.repository.DailyPlanRepository;
import me.nghlong3004.olympic.daily.sharing.entity.DailyEntryViewer;
import me.nghlong3004.olympic.daily.sharing.repository.DailyEntrySharingRepository;
import me.nghlong3004.olympic.daily.sharing.request.SaveDailySharingRequest;
import me.nghlong3004.olympic.daily.sharing.request.SaveDailySharingRequest.Audience;
import me.nghlong3004.olympic.daily.sharing.response.DailySharingResponse;
import me.nghlong3004.olympic.group.enums.MembershipStatus;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupMembershipRepository;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupRepository;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * A date is shared with a snapshot of named current members, never future members or other days.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/16/2026
 */
@Service
@RequiredArgsConstructor
public class DailyEntrySharingService {
  private final DailyPlanRepository plans;
  private final DailyEntrySharingRepository shares;
  private final AccountabilityGroupMembershipRepository members;
  private final AccountabilityGroupRepository groups;
  private final UserRepository users;
  private final CurrentUserProvider current;
  private final Clock clock;

  @Transactional(readOnly = true)
  public DailySharingResponse read(UUID planId) {
    var plan = plans.findById(planId).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    requireOwner(plan);
    return response(plan);
  }

  @Transactional
  public DailySharingResponse replace(UUID planId, SaveDailySharingRequest request) {
    if (request == null
        || request.expectedVersion() == null
        || request.audiences() == null
        || request.audiences().size() > 50) {
      throw ErrorCode.VALIDATION_ERROR.throwIt();
    }
    requireOwner(plans.findById(planId).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt));
    // Group locks precede the plan lock, matching feedback and membership consent mutations.
    var groupIds = new TreeSet<UUID>();
    shares
        .findByPlanIdOrderByGroupIdAscViewerIdAsc(planId)
        .forEach(v -> groupIds.add(v.getGroupId()));
    request
        .audiences()
        .forEach(
            a -> {
              if (a == null
                  || a.groupId() == null
                  || a.viewerIds() == null
                  || a.viewerIds().size() > 500
                  || a.viewerIds().stream().anyMatch(v -> v == null)) {
                throw ErrorCode.VALIDATION_ERROR.throwIt();
              }
              groupIds.add(a.groupId());
            });
    for (var id : groupIds) {
      groups.findForUpdateById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    }
    var plan = plans.findForUpdateById(planId).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
    requireOwner(plan);
    if (!request.expectedVersion().equals(plan.getVersion())) {
      throw ErrorCode.RESOURCE_STATE_CONFLICT.throwIt(
          "Reload this entry before changing its audience");
    }
    var selected = new ArrayList<DailyEntryViewer>();
    var uniqueGroups = new HashSet<UUID>();
    for (var audience : request.audiences()) {
      if (!uniqueGroups.add(audience.groupId())
          || !activeMember(audience.groupId(), plan.getOwnerId())) {
        throw ErrorCode.ACCESS_DENIED.throwIt();
      }
      var uniquePeople = new HashSet<UUID>();
      for (var viewer : audience.viewerIds()) {
        if (viewer.equals(plan.getOwnerId())
            || !uniquePeople.add(viewer)
            || !activeMember(audience.groupId(), viewer)) {
          throw ErrorCode.VALIDATION_ERROR.throwIt(
              "Choose distinct current members other than yourself");
        }
        selected.add(
            new DailyEntryViewer(planId, audience.groupId(), viewer, OffsetDateTime.now(clock)));
      }
    }
    if (selected.size() > 1000) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("The entry audience is too large");
    }
    var now = OffsetDateTime.now(clock);
    shares.deleteAll(shares.findByPlanIdOrderByGroupIdAscViewerIdAsc(planId));
    shares.flush();
    shares.saveAll(selected);
    plan.setUpdatedAt(now.isAfter(plan.getUpdatedAt()) ? now : plan.getUpdatedAt().plusNanos(1000));
    plans.saveAndFlush(plan);
    return response(plan);
  }

  @Transactional(readOnly = true)
  public boolean canRead(UUID groupId, UUID ownerId, UUID viewerId, LocalDate date) {
    if (!activeMember(groupId, ownerId) || !activeMember(groupId, viewerId)) {
      return false;
    }
    if (ownerId.equals(viewerId)) {
      return true;
    }
    if (date == null) {
      return false; // Per-day consent never opens private weekly reflections/aggregates.
    }
    return plans
        .findByOwnerIdAndPlanDate(ownerId, date)
        .map(plan -> shares.existsByPlanIdAndGroupIdAndViewerId(plan.getId(), groupId, viewerId))
        .orElse(false);
  }

  private void requireOwner(DailyPlan plan) {
    var actor =
        users
            .findByIdAndDeletedAtIsNull(current.getCurrentUser().id())
            .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);
    actor.requireActiveForAuth();
    if (!actor.getId().equals(plan.getOwnerId())) {
      throw ErrorCode.ACCESS_DENIED.throwIt();
    }
  }

  private boolean activeMember(UUID groupId, UUID userId) {
    return members
        .findByGroup_IdAndUser_Id(groupId, userId)
        .filter(
            m ->
                m.getStatus() == MembershipStatus.ACTIVE
                    && m.getUser().getDeletedAt() == null
                    && m.getUser().active())
        .isPresent();
  }

  private DailySharingResponse response(DailyPlan plan) {
    var visible =
        shares.findByPlanIdOrderByGroupIdAscViewerIdAsc(plan.getId()).stream()
            .filter(
                v ->
                    activeMember(v.getGroupId(), plan.getOwnerId())
                        && activeMember(v.getGroupId(), v.getViewerId()))
            .toList();
    var audiences =
        visible.stream()
            .map(DailyEntryViewer::getGroupId)
            .distinct()
            .map(
                group ->
                    new Audience(
                        group,
                        visible.stream()
                            .filter(v -> v.getGroupId().equals(group))
                            .map(DailyEntryViewer::getViewerId)
                            .toList()))
            .toList();
    return new DailySharingResponse(plan.getId(), plan.getVersion(), audiences);
  }
}
