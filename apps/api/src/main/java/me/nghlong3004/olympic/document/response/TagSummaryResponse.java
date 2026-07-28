package me.nghlong3004.olympic.document.response;

import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
public record TagSummaryResponse(UUID id, String code, String name, String slug) {}
