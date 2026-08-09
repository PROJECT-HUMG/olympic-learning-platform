package me.nghlong3004.olympic.assessment.dto;

/**
 * Normalized coordinates returned by the vision parser.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public record AssessmentBoundingBox(double left, double top, double right, double bottom) {

  public AssessmentBoundingBox clamped() {
    return new AssessmentBoundingBox(
        clamp(left), clamp(top), clamp(right), clamp(bottom));
  }

  private static double clamp(double value) {
    return Math.max(0, Math.min(1, value));
  }
}
