package me.nghlong3004.olympic.recognition.dto;

/**
 * Internal bytes returned only after publication/ownership authorization.
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
public record RecognitionDownload(String originalName, String contentType, byte[] content) {}
