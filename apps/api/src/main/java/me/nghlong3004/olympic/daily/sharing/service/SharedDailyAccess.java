package me.nghlong3004.olympic.daily.sharing.service;

import java.util.UUID;
import me.nghlong3004.olympic.user.entity.User;

/**
 * Current actor, account, and membership checks around group Daily sharing.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public interface SharedDailyAccess {

  /**
   * Reads the authenticated user again and requires a non-deleted ACTIVE account.
   *
   * @return current account
   */
  User requireActor();

  /**
   * Allows an active member to open this group's selected-day list. A missing group and a
   * non-member receive the same not-found result.
   *
   * @param groupId accountability group
   * @return current member
   */
  User requireDashboardViewer(UUID groupId);

  /**
   * Allows a read of one owner's saved Daily material in this group. The actor must be an active
   * member. Another owner's account and membership must still be active. Sharing that is off,
   * deselected, or left denies the viewer. The owner can read their own material only inside a
   * group where they are still an active member.
   *
   * @param groupId accountability group in the path
   * @param ownerId user who owns the plan or weekly review
   * @return current reader
   */
  User requireSharedReader(UUID groupId, UUID ownerId);

  /**
   * Reports whether the viewer may currently see this owner's Daily material. False does not say
   * whether a plan or review exists.
   *
   * @param groupId accountability group
   * @param ownerId user who owns the material
   * @param viewerId user requesting the material
   * @return true when the current rows allow that read
   */
  boolean visibleTo(UUID groupId, UUID ownerId, UUID viewerId);
}
