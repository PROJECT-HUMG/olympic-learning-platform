package me.nghlong3004.olympic.group.response;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record GroupInvitationResponse(
    UUID id,
    UUID groupId,
    String groupName,
    UUID inviterId,
    String inviterDisplayName,
    UUID targetUserId,
    String status,
    OffsetDateTime createdAt) {}
