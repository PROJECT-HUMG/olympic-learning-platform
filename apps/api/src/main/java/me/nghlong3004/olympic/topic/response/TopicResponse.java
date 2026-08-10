package me.nghlong3004.olympic.topic.response;

import java.util.UUID;

/** @author nghlong3004 (Long Nguyen Hoang) @since 8/10/2026 */
public record TopicResponse(UUID id, UUID subjectId, String name, String slug) {}
