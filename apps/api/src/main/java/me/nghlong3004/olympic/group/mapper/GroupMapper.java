package me.nghlong3004.olympic.group.mapper;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.group.entity.AccountabilityGroup;
import me.nghlong3004.olympic.group.entity.AccountabilityGroupMembership;
import me.nghlong3004.olympic.group.entity.GroupInvitation;
import me.nghlong3004.olympic.group.response.GroupDetailResponse;
import me.nghlong3004.olympic.group.response.GroupInvitationResponse;
import me.nghlong3004.olympic.group.response.GroupMemberResponse;
import me.nghlong3004.olympic.group.response.GroupSharingResponse;
import me.nghlong3004.olympic.group.response.GroupSummaryResponse;
import me.nghlong3004.olympic.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * Structural group projections after service consent, account and audience decisions.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/04/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface GroupMapper {
  @Mapping(target = "ownerId", source = "owner.id")
  GroupSummaryResponse toSummary(AccountabilityGroup group);

  default GroupMemberResponse toMember(User user) {
    return new GroupMemberResponse(user.getId(), displayName(user));
  }

  default GroupDetailResponse toDetail(
      AccountabilityGroup group, List<GroupMemberResponse> members, GroupSharingResponse sharing) {
    return new GroupDetailResponse(
        group.getId(), group.getName(), group.getOwner().getId(), members, sharing);
  }

  default GroupSharingResponse toSharing(AccountabilityGroupMembership own, List<UUID> viewerIds) {
    return new GroupSharingResponse(own.isShareDaily(), own.getSharingMode(), viewerIds);
  }

  default GroupInvitationResponse toInvitation(
      GroupInvitation row, AccountabilityGroup group, User inviter) {
    return new GroupInvitationResponse(
        row.getId(), group.getId(), group.getName(), inviter.getId(), displayName(inviter),
        row.getTargetUserId(), row.getStatus(), row.getCreatedAt());
  }

  default String displayName(User user) {
    return user.getFullName() == null || user.getFullName().isBlank()
        ? user.getUsername() : user.getFullName();
  }
}
