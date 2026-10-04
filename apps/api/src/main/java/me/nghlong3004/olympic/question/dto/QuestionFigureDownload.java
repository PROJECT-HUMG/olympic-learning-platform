package me.nghlong3004.olympic.question.dto;

/**
 * Private figure bytes returned only after the caller has already been authorized.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public record QuestionFigureDownload(String originalName, String contentType, byte[] content) {}
