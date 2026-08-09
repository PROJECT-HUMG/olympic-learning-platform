package me.nghlong3004.olympic.assessment.dto;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public record AssessmentPage(int pageNumber, byte[] image, int width, int height, String text) {}
