package me.nghlong3004.olympic.group.service;

import java.util.UUID;
import me.nghlong3004.olympic.group.entity.AccountabilityGroup;
import me.nghlong3004.olympic.group.entity.AccountabilityGroupMembership;
import me.nghlong3004.olympic.group.entity.AccountabilityGroupShareViewer;
import me.nghlong3004.olympic.group.enums.MembershipStatus;
import me.nghlong3004.olympic.group.enums.SharingMode;

/**
 * Persists accountability groups, accepted memberships, and each member's own share settings. This
 * service does not invite, notify, or accept an open join.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public interface GroupMembershipService {

  /**
   * Creates a group owned by the user and an ACTIVE membership for that user. Sharing starts off in
   * GROUP mode. The group owner does not gain access to anyone else's material.
   *
   * @param ownerUserId founding user
   * @param name group name, required and at most 120 characters
   * @return saved group
   */
  AccountabilityGroup createGroup(UUID ownerUserId, String name);

  /**
   * Stores an ACTIVE membership after explicit consent has already been recorded by a future invite
   * flow. Sharing starts off. Calling this method is not itself consent, an invitation, or a public
   * join.
   *
   * @param groupId existing group
   * @param userId user who already accepted membership
   * @return saved membership
   */
  AccountabilityGroupMembership recordAcceptedMember(UUID groupId, UUID userId);

  /**
   * Changes only the actor's share settings in one group.
   *
   * @param groupId group whose settings change
   * @param actorId member who owns those settings
   * @param shareDaily whether that member currently shares Daily material
   * @param sharingMode GROUP or SELECTED_MEMBERS
   * @return updated membership
   */
  AccountabilityGroupMembership updateOwnShare(
      UUID groupId, UUID actorId, boolean shareDaily, SharingMode sharingMode);

  /**
   * Sets whether one current member is selected to read the actor's material. The actor cannot
   * select viewers for another member.
   *
   * @param groupId group context
   * @param actorId member who owns the share
   * @param viewerId other member of the same group
   * @param active current selection state
   * @return saved selection
   */
  AccountabilityGroupShareViewer setSelectedViewer(
      UUID groupId, UUID actorId, UUID viewerId, boolean active);

  /**
   * Changes the actor's own membership status. An inactive member cannot read others and cannot be
   * read by others.
   *
   * @param groupId group context
   * @param userId member changing their own status
   * @param status ACTIVE or INACTIVE
   * @return updated membership
   */
  AccountabilityGroupMembership changeOwnStatus(UUID groupId, UUID userId, MembershipStatus status);
}
