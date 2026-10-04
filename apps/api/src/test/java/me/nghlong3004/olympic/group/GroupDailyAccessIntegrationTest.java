package me.nghlong3004.olympic.group;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.util.UUID;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.group.enums.MembershipStatus;
import me.nghlong3004.olympic.group.enums.SharingMode;
import me.nghlong3004.olympic.group.repository.AccountabilityGroupMembershipRepository;
import me.nghlong3004.olympic.group.service.GroupDailyAccess;
import me.nghlong3004.olympic.group.service.GroupMembershipService;
import me.nghlong3004.olympic.group.service.impl.GroupDailyAccessImpl;
import me.nghlong3004.olympic.group.service.impl.GroupMembershipServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Current PostgreSQL rows decide group sharing. This does not store or read Daily material.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@DataJpaTest(
    properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true"},
    showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers(disabledWithoutDocker = true)
@Import({
  GroupDailyAccessImpl.class,
  GroupMembershipServiceImpl.class,
  GroupDailyAccessIntegrationTest.UtcClock.class
})
class GroupDailyAccessIntegrationTest {
  private static final UUID OWNER = UUID.fromString("00000000-0000-0000-0000-000000000e01");
  private static final UUID VIEWER = UUID.fromString("00000000-0000-0000-0000-000000000e02");
  private static final UUID OTHER = UUID.fromString("00000000-0000-0000-0000-000000000e03");
  private static final UUID ADMIN = UUID.fromString("00000000-0000-0000-0000-000000000e04");
  private static final UUID FOUNDER = UUID.fromString("00000000-0000-0000-0000-000000000e05");
  private static final UUID OUTSIDER = UUID.fromString("00000000-0000-0000-0000-000000000e06");

  @Container
  @ServiceConnection
  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");

  @Autowired private JdbcTemplate jdbc;
  @Autowired private GroupMembershipService groups;
  @Autowired private GroupDailyAccess access;
  @Autowired private AccountabilityGroupMembershipRepository memberships;

  @BeforeEach
  void users() {
    jdbc.update("DELETE FROM accountability_group_share_viewers");
    jdbc.update("DELETE FROM accountability_group_memberships");
    jdbc.update("DELETE FROM accountability_groups");
    jdbc.update("DELETE FROM users WHERE id IN (?,?,?,?,?,?)", OWNER, VIEWER, OTHER, ADMIN, FOUNDER, OUTSIDER);
    insertLecturer(OWNER, "group-owner");
    insertLecturer(VIEWER, "group-viewer");
    insertLecturer(OTHER, "group-other");
    insertLecturer(FOUNDER, "group-founder");
    insertLecturer(OUTSIDER, "group-outsider");
    insertAdmin(ADMIN, "group-admin");
  }

  @Test
  void falseDefaultDeniesNonOwnerAndAllowsOwner() {
    var group = groups.createGroup(OWNER, "Morning").getId();
    groups.recordAcceptedMember(group, VIEWER);
    var ownerMembership = memberships.findByGroup_IdAndUser_Id(group, OWNER).orElseThrow();
    assertThat(ownerMembership.isShareDaily()).isFalse();
    assertThat(ownerMembership.getSharingMode()).isEqualTo(SharingMode.GROUP);

    jdbc.update(
        "INSERT INTO accountability_group_memberships (id, group_id, user_id) VALUES (?, ?, ?)",
        UUID.fromString("00000000-0000-0000-0000-000000000e21"), group, OTHER);
    var databaseDefault = memberships.findByGroup_IdAndUser_Id(group, OTHER).orElseThrow();
    assertThat(databaseDefault.isShareDaily()).isFalse();
    assertThat(databaseDefault.getSharingMode()).isEqualTo(SharingMode.GROUP);
    assertThat(databaseDefault.getStatus()).isEqualTo(MembershipStatus.ACTIVE);

    access.requireViewer(group, OWNER, OWNER);
    denied(group, OWNER, VIEWER);
    assertThat(access.authorizedViewerIds(group, OWNER)).containsExactly(OWNER);
  }

  @Test
  void selectedAudienceIsPerGroupAndRejectsMismatch() {
    var first = groups.createGroup(OWNER, "First").getId();
    var second = groups.createGroup(OWNER, "Second").getId();
    groups.recordAcceptedMember(first, VIEWER);
    groups.recordAcceptedMember(first, OTHER);
    groups.recordAcceptedMember(second, VIEWER);
    groups.updateOwnShare(first, OWNER, true, SharingMode.SELECTED_MEMBERS);
    groups.updateOwnShare(second, OWNER, true, SharingMode.GROUP);
    groups.setSelectedViewer(first, OWNER, VIEWER, true);

    access.requireViewer(first, OWNER, VIEWER);
    denied(first, OWNER, OTHER);
    denied(first, OWNER, OUTSIDER);
    access.requireViewer(second, OWNER, VIEWER);
    groups.updateOwnShare(second, OWNER, false, SharingMode.GROUP);
    denied(second, OWNER, VIEWER);
    access.requireViewer(first, OWNER, VIEWER);
  }

  @Test
  void revocationIsImmediateForShareMembershipAndSelection() {
    var group = groups.createGroup(OWNER, "Revoke").getId();
    groups.recordAcceptedMember(group, VIEWER);
    groups.updateOwnShare(group, OWNER, true, SharingMode.GROUP);
    access.requireViewer(group, OWNER, VIEWER);

    groups.updateOwnShare(group, OWNER, false, SharingMode.GROUP);
    denied(group, OWNER, VIEWER);
    assertThat(access.authorizedViewerIds(group, OWNER)).containsExactly(OWNER);

    groups.updateOwnShare(group, OWNER, true, SharingMode.GROUP);
    access.requireViewer(group, OWNER, VIEWER);
    groups.changeOwnStatus(group, VIEWER, MembershipStatus.INACTIVE);
    denied(group, OWNER, VIEWER);

    groups.changeOwnStatus(group, VIEWER, MembershipStatus.ACTIVE);
    groups.updateOwnShare(group, OWNER, true, SharingMode.SELECTED_MEMBERS);
    groups.setSelectedViewer(group, OWNER, VIEWER, false);
    denied(group, OWNER, VIEWER);
    groups.setSelectedViewer(group, OWNER, VIEWER, true);
    access.requireViewer(group, OWNER, VIEWER);
    groups.setSelectedViewer(group, OWNER, VIEWER, false);
    denied(group, OWNER, VIEWER);
  }

  @Test
  void adminRoleAndGroupFounderCannotBypassAnotherMembersShare() {
    var group = groups.createGroup(FOUNDER, "Founder").getId();
    groups.recordAcceptedMember(group, OWNER);
    groups.recordAcceptedMember(group, VIEWER);
    groups.recordAcceptedMember(group, ADMIN);
    groups.updateOwnShare(group, FOUNDER, true, SharingMode.GROUP);

    denied(group, OWNER, FOUNDER);
    denied(group, OWNER, ADMIN);
    denied(group, OWNER, VIEWER);
    access.requireViewer(group, OWNER, OWNER);

    groups.updateOwnShare(group, OWNER, true, SharingMode.SELECTED_MEMBERS);
    groups.setSelectedViewer(group, OWNER, VIEWER, true);
    access.requireViewer(group, OWNER, VIEWER);
    denied(group, OWNER, FOUNDER);
    denied(group, OWNER, ADMIN);
  }

  private void denied(UUID groupId, UUID ownerId, UUID viewerId) {
    assertThatThrownBy(() -> access.requireViewer(groupId, ownerId, viewerId))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.ACCESS_DENIED);
  }

  private void insertLecturer(UUID id, String username) {
    jdbc.update(
        "INSERT INTO users (id, email, username, role, status) VALUES (?, ?, ?, 'LECTURER', 'ACTIVE')",
        id, username + "@example.com", username);
  }

  private void insertAdmin(UUID id, String username) {
    jdbc.update(
        "INSERT INTO users (id, email, username, role, status) VALUES (?, ?, ?, 'ADMIN', 'ACTIVE')",
        id, username + "@example.com", username);
  }

  /**
   * @author nghlong3004 (Long Nguyen Hoang)
   * @since 10/4/2026
   */
  @TestConfiguration(proxyBeanMethods = false)
  static class UtcClock {
    @Bean
    Clock clock() {
      return Clock.systemUTC();
    }
  }
}
