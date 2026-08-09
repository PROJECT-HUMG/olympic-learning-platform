package me.nghlong3004.olympic.assessment.dto;

import me.nghlong3004.olympic.assessment.enums.AssessmentAssetRole;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public record AssessmentAssetRegion(AssessmentBoundingBox bbox, AssessmentAssetRole role, String altText) {}
