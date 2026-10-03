package me.nghlong3004.olympic.recognition.request;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
public record UpdateRecognitionPreferencesRequest(@Schema(description = "Opt in to rankings including all approved points") boolean rankingOptIn) {}
