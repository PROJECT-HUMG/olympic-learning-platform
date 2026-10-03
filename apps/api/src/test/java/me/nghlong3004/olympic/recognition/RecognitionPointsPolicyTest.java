package me.nghlong3004.olympic.recognition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.recognition.enums.AchievementAward;
import me.nghlong3004.olympic.recognition.enums.AchievementCategory;
import me.nghlong3004.olympic.recognition.service.RecognitionPointsPolicy;
import org.junit.jupiter.api.Test;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
class RecognitionPointsPolicyTest {
  @Test
  void academicAwardTablesMatchTheApprovedPolicy() {
    assertAwards(AchievementCategory.OLYMPIC_NATIONAL, 10, 9, 8, 7);
    assertAwards(AchievementCategory.OLYMPIC_SCHOOL, 5, 4, 3, 2);
    assertAwards(AchievementCategory.RESEARCH_MINISTRY, 8, 7, 6, 5);
    assertAwards(AchievementCategory.RESEARCH_SCHOOL, 6, 5, 4, 3);
    assertAwards(AchievementCategory.RESEARCH_OTHER, 6, 5, 4, 3);
  }

  @Test
  void participationAddsToAwardsInsteadOfReplacingThem() {
    assertThat(total(AchievementCategory.OLYMPIC_NATIONAL, AchievementAward.FIRST, true)).isEqualTo(16);
    assertThat(total(AchievementCategory.OLYMPIC_SCHOOL, AchievementAward.SECOND, true)).isEqualTo(6);
    assertThat(total(AchievementCategory.RESEARCH_SCHOOL, AchievementAward.THIRD, true)).isEqualTo(7);
    assertThat(total(AchievementCategory.OLYMPIC_NATIONAL, AchievementAward.NONE, true)).isEqualTo(6);
    assertThat(total(AchievementCategory.OLYMPIC_SCHOOL, AchievementAward.NONE, true)).isEqualTo(2);
    assertThat(total(AchievementCategory.RESEARCH_SCHOOL, AchievementAward.NONE, true)).isEqualTo(3);
  }

  @Test
  void multipleAcademicResultsAreAdditiveWithoutAHighestOnlyOrTenPointCap() {
    int points = total(AchievementCategory.OLYMPIC_NATIONAL, AchievementAward.FIRST, true)
        + total(AchievementCategory.OLYMPIC_NATIONAL, AchievementAward.SECOND, true)
        + total(AchievementCategory.RESEARCH_SCHOOL, AchievementAward.FIRST, true);
    assertThat(points).isEqualTo(40);
  }

  @Test
  void unselectedParticipationDoesNotAddPoints() {
    for (var category : AchievementCategory.values()) {
      assertThat(RecognitionPointsPolicy.participationPoints(category, false)).isZero();
      assertThat(RecognitionPointsPolicy.awardPoints(category, AchievementAward.NONE)).isZero();
    }
  }

  @Test
  void unsupportedParticipationAndEmptyClaimsAreRejected() {
    for (var category : new AchievementCategory[] {
        AchievementCategory.RESEARCH_MINISTRY, AchievementCategory.RESEARCH_OTHER}) {
      assertThatThrownBy(() -> RecognitionPointsPolicy.validate(category, AchievementAward.FIRST, true))
          .isInstanceOf(ApiException.class);
    }
    for (var category : AchievementCategory.values()) {
      assertThatThrownBy(() -> RecognitionPointsPolicy.validate(category, AchievementAward.NONE, false))
          .isInstanceOf(ApiException.class);
    }
  }

  @Test
  void incompleteClaimsProduceValidationErrorsRatherThanUnexpectedFailures() {
    assertThatThrownBy(() -> RecognitionPointsPolicy.validate(null, AchievementAward.FIRST, false))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> RecognitionPointsPolicy.validate(AchievementCategory.OLYMPIC_SCHOOL, null, true))
        .isInstanceOf(ApiException.class);
  }

  private void assertAwards(AchievementCategory category, int first, int second, int third, int consolation) {
    assertThat(RecognitionPointsPolicy.awardPoints(category, AchievementAward.FIRST)).isEqualTo(first);
    assertThat(RecognitionPointsPolicy.awardPoints(category, AchievementAward.SECOND)).isEqualTo(second);
    assertThat(RecognitionPointsPolicy.awardPoints(category, AchievementAward.THIRD)).isEqualTo(third);
    assertThat(RecognitionPointsPolicy.awardPoints(category, AchievementAward.CONSOLATION)).isEqualTo(consolation);
  }

  private int total(AchievementCategory category, AchievementAward award, boolean participation) {
    RecognitionPointsPolicy.validate(category, award, participation);
    return RecognitionPointsPolicy.awardPoints(category, award)
        + RecognitionPointsPolicy.participationPoints(category, participation);
  }
}
