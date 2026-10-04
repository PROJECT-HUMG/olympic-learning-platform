package me.nghlong3004.olympic.group.response;

import java.util.List;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record GroupDetailResponse(
    UUID id,
    String name,
    UUID ownerId,
    List<GroupMemberResponse> members,
    GroupSharingResponse mySharing) {}
