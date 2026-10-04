package me.nghlong3004.olympic.group.response;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.group.enums.SharingMode;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public record GroupSharingResponse(
    boolean shareDaily, SharingMode sharingMode, List<UUID> selectedViewerIds) {}
