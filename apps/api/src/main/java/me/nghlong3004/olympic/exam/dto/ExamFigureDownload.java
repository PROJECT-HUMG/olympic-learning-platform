package me.nghlong3004.olympic.exam.dto;

/**
 * Private frozen figure bytes returned only after the caller is authorized.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
public record ExamFigureDownload(String originalName, String contentType, byte[] content) {}
