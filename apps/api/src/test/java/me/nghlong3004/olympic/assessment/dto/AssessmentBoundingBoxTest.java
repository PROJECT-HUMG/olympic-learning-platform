package me.nghlong3004.olympic.assessment.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
class AssessmentBoundingBoxTest {

  @Test
  void clampsVisionCoordinatesBeforeCropping() {
    var result = new AssessmentBoundingBox(-0.2, 0.25, 1.4, 1.1).clamped();

    assertThat(result.left()).isZero();
    assertThat(result.top()).isEqualTo(0.25);
    assertThat(result.right()).isEqualTo(1);
    assertThat(result.bottom()).isEqualTo(1);
  }
}
