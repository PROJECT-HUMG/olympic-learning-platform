package me.nghlong3004.olympic.document.request;

import java.util.List;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
public record DocumentSearchRequest(
    String keyword, UUID categoryId, UUID subjectId, List<UUID> tagIds) {}
