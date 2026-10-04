package me.nghlong3004.olympic.group.service;

import java.util.List;
import java.util.UUID;

/**
 * Current group-sharing gate for one owner's personal Daily material.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public interface GroupDailyAccess {

  /**
   * Allows the owner to read their own material. Every other viewer is allowed only when current
   * rows show both users ACTIVE in this group, the owner's share is on, and the audience is the
   * whole group or an active selection. Role, admin, and group-owner status are ignored. A share
   * that is off, an inactive member, or an inactive selection denies on this call.
   *
   * @param groupId accountability group whose current settings apply
   * @param ownerId user who owns the material
   * @param viewerId user requesting that material
   */
  void requireViewer(UUID groupId, UUID ownerId, UUID viewerId);

  /**
   * Lists who may read the owner's material in this group from current rows. The owner is included
   * when the group exists. There is no stored grant list.
   *
   * @param groupId accountability group whose current settings apply
   * @param ownerId user who owns the material
   * @return current viewer ids
   */
  List<UUID> authorizedViewerIds(UUID groupId, UUID ownerId);
}
