package me.nghlong3004.olympic.group.service;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.group.request.CreateGroupInvitationRequest;
import me.nghlong3004.olympic.group.request.CreateGroupRequest;
import me.nghlong3004.olympic.group.request.ReplaceGroupSharingRequest;
import me.nghlong3004.olympic.group.response.*;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public interface GroupService {
  /**
   * @return current actor's active groups, never a directory
   */
  List<GroupSummaryResponse> list();

  /**
   * @param request bounded group name @return persisted group with founder default-OFF
   */
  GroupSummaryResponse create(CreateGroupRequest request);

  /**
   * @param groupId current member's group @return active identities and own settings
   */
  GroupDetailResponse detail(UUID groupId);

  /**
   * Replaces only the authenticated actor's consent, validating the entire audience before writing.
   *
   * @param groupId current group
   * @param request atomic own audience replacement
   * @return persisted settings
   */
  GroupSharingResponse replaceSharing(UUID groupId, ReplaceGroupSharingRequest request);

  /**
   * @param groupId current group to leave; no other actor's membership may be changed
   */
  void leave(UUID groupId);

  /**
   * Persists a targeted invitation without membership or an outbound notification.
   *
   * @param groupId founder's group
   * @param request identified target
   * @return pending invitation, never membership
   */
  GroupInvitationResponse invite(UUID groupId, CreateGroupInvitationRequest request);

  /**
   * @return current target's live pending invitations
   */
  List<GroupInvitationResponse> invitations();

  /**
   * @param invitationId targeted invitation @return group summary; replay never reactivates
   *     membership
   */
  GroupSummaryResponse accept(UUID invitationId);

  /**
   * @param invitationId targeted invitation; terminal outcomes cannot be changed
   */
  void decline(UUID invitationId);
}
