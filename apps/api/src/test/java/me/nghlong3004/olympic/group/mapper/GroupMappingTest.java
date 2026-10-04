package me.nghlong3004.olympic.group.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.group.entity.AccountabilityGroup;
import me.nghlong3004.olympic.group.entity.AccountabilityGroupMembership;
import me.nghlong3004.olympic.group.entity.GroupInvitation;
import me.nghlong3004.olympic.group.enums.SharingMode;
import me.nghlong3004.olympic.group.response.GroupDetailResponse;
import me.nghlong3004.olympic.group.response.GroupInvitationResponse;
import me.nghlong3004.olympic.group.response.GroupMemberResponse;
import me.nghlong3004.olympic.group.response.GroupSharingResponse;
import me.nghlong3004.olympic.group.response.GroupSummaryResponse;
import me.nghlong3004.olympic.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mapstruct.factory.Mappers;

/**
 * Mapping preserves service-resolved group identities, audience ordering and display names.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/04/2026
 */
class GroupMappingTest {
  private final GroupMapper mapper = Mappers.getMapper(GroupMapper.class);

  @ParameterizedTest
  @NullSource
  @ValueSource(strings = {"", "   ", " Full Name "})
  void memberAndInvitationUseExactNameFallback(String fullName) {
    var user = user(fullName);
    var group = AccountabilityGroup.builder().id(UUID.randomUUID()).name("Group").owner(user).build();
    var stamp = OffsetDateTime.parse("2026-10-04T12:00:00Z");
    var invitation = GroupInvitation.builder().id(UUID.randomUUID()).groupId(group.getId())
        .inviterId(user.getId()).targetUserId(UUID.randomUUID()).status("PENDING").createdAt(stamp).build();
    var name = fullName == null || fullName.isBlank() ? "username" : fullName;
    assertThat(mapper.toMember(user)).isEqualTo(new GroupMemberResponse(user.getId(), name));
    assertThat(mapper.toInvitation(invitation, group, user)).isEqualTo(new GroupInvitationResponse(
        invitation.getId(), group.getId(), "Group", user.getId(), name, invitation.getTargetUserId(),
        "PENDING", stamp));
  }

  @Test
  void detailAndSharingCopyOnlyTheAlreadySelectedMembersAndAudience() {
    var owner = user("Owner");
    var group = AccountabilityGroup.builder().id(UUID.randomUUID()).name("Group").owner(owner).build();
    var membership = AccountabilityGroupMembership.builder().group(group).user(owner)
        .shareDaily(false).sharingMode(SharingMode.SELECTED_MEMBERS).build();
    var selected = List.of(UUID.randomUUID(), UUID.randomUUID());
    var sharing = mapper.toSharing(membership, selected);
    assertThat(sharing).isEqualTo(new GroupSharingResponse(false, SharingMode.SELECTED_MEMBERS, selected));
    assertThat(sharing.selectedViewerIds()).isSameAs(selected);
    var members = List.of(mapper.toMember(owner));
    assertThat(mapper.toSummary(group)).isEqualTo(new GroupSummaryResponse(group.getId(), "Group", owner.getId()));
    var detail = mapper.toDetail(group, members, sharing);
    assertThat(detail).isEqualTo(new GroupDetailResponse(group.getId(), "Group", owner.getId(), members, sharing));
    assertThat(detail.members()).isSameAs(members);
    assertThat(detail.mySharing()).isSameAs(sharing);
  }

  private User user(String fullName) {
    var user = new User();
    user.setId(UUID.randomUUID());
    user.setUsername("username");
    user.setFullName(fullName);
    return user;
  }
}
