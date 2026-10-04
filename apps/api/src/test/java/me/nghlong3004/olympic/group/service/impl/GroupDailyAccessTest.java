package me.nghlong3004.olympic.group.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.group.entity.AccountabilityGroup;
import me.nghlong3004.olympic.group.entity.AccountabilityGroupMembership;
import me.nghlong3004.olympic.group.entity.AccountabilityGroupShareViewer;
import me.nghlong3004.olympic.group.enums.MembershipStatus;
import me.nghlong3004.olympic.group.enums.SharingMode;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupMembershipRepository;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupRepository;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupShareViewerRepository;
import me.nghlong3004.olympic.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Policy decisions without a database. PostgreSQL coverage is separate.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@ExtendWith(MockitoExtension.class)
class GroupDailyAccessTest {
  private static final UUID GROUP = UUID.fromString("00000000-0000-0000-0000-000000000d10");
  private static final UUID OWNER = UUID.fromString("00000000-0000-0000-0000-000000000d01");
  private static final UUID VIEWER = UUID.fromString("00000000-0000-0000-0000-000000000d02");
  private static final UUID OTHER = UUID.fromString("00000000-0000-0000-0000-000000000d03");
  private static final UUID ADMIN = UUID.fromString("00000000-0000-0000-0000-000000000d04");

  @Mock private AccountabilityGroupRepository groups;
  @Mock private AccountabilityGroupMembershipRepository memberships;
  @Mock private AccountabilityGroupShareViewerRepository viewers;

  private GroupDailyAccessImpl access;

  @BeforeEach
  void setUp() {
    access = new GroupDailyAccessImpl(groups, memberships, viewers);
  }

  @Test
  void ownerReadsOwnMaterialWhenSharingIsOff() {
    when(groups.existsById(GROUP)).thenReturn(true);

    access.requireViewer(GROUP, OWNER, OWNER);

    assertThat(access.authorizedViewerIds(GROUP, OWNER)).containsExactly(OWNER);
  }

  @Test
  void falseShareDeniesAnotherActiveMember() {
    when(groups.existsById(GROUP)).thenReturn(true);
    when(memberships.findByGroup_IdAndUser_Id(GROUP, OWNER))
        .thenReturn(Optional.of(membership(OWNER, MembershipStatus.ACTIVE, false, SharingMode.GROUP)));

    denied(VIEWER);
  }

  @Test
  void selectedModeAllowsOnlyTheActiveSelection() {
    when(groups.existsById(GROUP)).thenReturn(true);
    when(memberships.findByGroup_IdAndUser_Id(GROUP, OWNER))
        .thenReturn(Optional.of(membership(OWNER, MembershipStatus.ACTIVE, true, SharingMode.SELECTED_MEMBERS)));
    when(memberships.findByGroup_IdAndUser_Id(GROUP, VIEWER))
        .thenReturn(Optional.of(membership(VIEWER, MembershipStatus.ACTIVE, false, SharingMode.GROUP)));
    when(memberships.findByGroup_IdAndUser_Id(GROUP, OTHER))
        .thenReturn(Optional.of(membership(OTHER, MembershipStatus.ACTIVE, false, SharingMode.GROUP)));
    when(viewers.findByOwner_IdAndGroup_IdAndViewer_Id(OWNER, GROUP, VIEWER))
        .thenReturn(Optional.of(selection(VIEWER, true)));
    when(viewers.findByOwner_IdAndGroup_IdAndViewer_Id(OWNER, GROUP, OTHER)).thenReturn(Optional.empty());

    access.requireViewer(GROUP, OWNER, VIEWER);
    denied(OTHER);
  }

  @Test
  void inactiveSelectionOrMembershipAndWrongGroupDeny() {
    when(groups.existsById(GROUP)).thenReturn(true);
    when(memberships.findByGroup_IdAndUser_Id(GROUP, OWNER))
        .thenReturn(Optional.of(membership(OWNER, MembershipStatus.ACTIVE, true, SharingMode.SELECTED_MEMBERS)));
    when(memberships.findByGroup_IdAndUser_Id(GROUP, VIEWER))
        .thenReturn(Optional.of(membership(VIEWER, MembershipStatus.ACTIVE, false, SharingMode.GROUP)));
    when(viewers.findByOwner_IdAndGroup_IdAndViewer_Id(OWNER, GROUP, VIEWER))
        .thenReturn(Optional.of(selection(VIEWER, false)));
    denied(VIEWER);

    when(memberships.findByGroup_IdAndUser_Id(GROUP, VIEWER))
        .thenReturn(Optional.of(membership(VIEWER, MembershipStatus.INACTIVE, false, SharingMode.GROUP)));
    denied(VIEWER);

    when(memberships.findByGroup_IdAndUser_Id(GROUP, OTHER)).thenReturn(Optional.empty());
    denied(OTHER);
  }

  @Test
  void turningShareOffRemovesTheViewerImmediately() {
    when(groups.existsById(GROUP)).thenReturn(true);
    when(memberships.findByGroup_IdAndUser_Id(GROUP, VIEWER))
        .thenReturn(Optional.of(membership(VIEWER, MembershipStatus.ACTIVE, false, SharingMode.GROUP)));
    when(memberships.findByGroup_IdAndUser_Id(GROUP, OWNER))
        .thenReturn(
            Optional.of(membership(OWNER, MembershipStatus.ACTIVE, true, SharingMode.GROUP)),
            Optional.of(membership(OWNER, MembershipStatus.ACTIVE, false, SharingMode.GROUP)));

    access.requireViewer(GROUP, OWNER, VIEWER);
    denied(VIEWER);
    assertThat(access.authorizedViewerIds(GROUP, OWNER)).containsExactly(OWNER);
  }

  @Test
  void adminIdHasNoBypassWithoutARoleLookup() {
    when(groups.existsById(GROUP)).thenReturn(true);
    when(memberships.findByGroup_IdAndUser_Id(GROUP, OWNER)).thenReturn(Optional.empty());

    denied(ADMIN);
  }

  @Test
  void missingGroupIsNotFound() {
    when(groups.existsById(GROUP)).thenReturn(false);

    assertThatThrownBy(() -> access.requireViewer(GROUP, OWNER, OWNER))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);
  }

  private void denied(UUID viewerId) {
    assertThatThrownBy(() -> access.requireViewer(GROUP, OWNER, viewerId))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.ACCESS_DENIED);
  }

  private static AccountabilityGroupMembership membership(
      UUID userId, MembershipStatus status, boolean shareDaily, SharingMode mode) {
    return AccountabilityGroupMembership.builder()
        .group(AccountabilityGroup.builder().id(GROUP).name("Group").build())
        .user(User.builder().id(userId).build())
        .status(status)
        .shareDaily(shareDaily)
        .sharingMode(mode)
        .build();
  }

  private static AccountabilityGroupShareViewer selection(UUID viewerId, boolean active) {
    return AccountabilityGroupShareViewer.builder()
        .owner(User.builder().id(OWNER).build())
        .viewer(User.builder().id(viewerId).build())
        .active(active)
        .build();
  }
}
