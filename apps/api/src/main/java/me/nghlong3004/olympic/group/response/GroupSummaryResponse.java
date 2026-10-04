package me.nghlong3004.olympic.group.response;

import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record GroupSummaryResponse(UUID id, String name, UUID ownerId, GroupAvatarResponse avatar) {}
