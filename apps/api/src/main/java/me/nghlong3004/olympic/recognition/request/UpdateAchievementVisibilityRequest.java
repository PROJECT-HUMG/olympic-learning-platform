package me.nghlong3004.olympic.recognition.request;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
public record UpdateAchievementVisibilityRequest(@Schema(description = "Expose approved details on public profile") boolean publicVisible) {}
