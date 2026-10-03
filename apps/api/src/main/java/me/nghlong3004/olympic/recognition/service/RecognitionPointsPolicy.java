package me.nghlong3004.olympic.recognition.service;

import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.recognition.enums.AchievementAward;
import me.nghlong3004.olympic.recognition.enums.AchievementCategory;

/**
 * Defines academic recognition points; honorary memories never invoke this policy.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
public final class RecognitionPointsPolicy {
  private RecognitionPointsPolicy() {}

  /**
   * Calculates the award component without applying a yearly or all-time cap.
   *
   * @param category supported academic category
   * @param award award tier, including participation-only NONE
   * @return award points only
   */
  public static int awardPoints(AchievementCategory category, AchievementAward award) {
    if (category == null || award == null) throw ErrorCode.VALIDATION_ERROR.throwIt("Category and award are required");
    if (award == AchievementAward.NONE) return 0;
    int first = switch (category) {
      case OLYMPIC_NATIONAL -> 10;
      case OLYMPIC_SCHOOL -> 5;
      case RESEARCH_MINISTRY -> 8;
      case RESEARCH_SCHOOL, RESEARCH_OTHER -> 6;
    };
    return first - (award.ordinal() - AchievementAward.FIRST.ordinal());
  }

  /**
   * Calculates participation independently so an award can receive both components.
   *
   * @param category supported academic category
   * @param includeParticipation whether participation is claimed
   * @return additive participation points, zero when unclaimed or not defined
   */
  public static int participationPoints(AchievementCategory category, boolean includeParticipation) {
    if (category == null) throw ErrorCode.VALIDATION_ERROR.throwIt("Category is required");
    if (!includeParticipation) return 0;
    return switch (category) {
      case OLYMPIC_NATIONAL -> 6;
      case OLYMPIC_SCHOOL -> 2;
      case RESEARCH_SCHOOL -> 3;
      case RESEARCH_MINISTRY, RESEARCH_OTHER -> 0;
    };
  }

  /**
   * Rejects empty claims and participation categories whose points have not been defined.
   *
   * @param category academic category
   * @param award award tier
   * @param includeParticipation whether additive participation is claimed
   */
  public static void validate(AchievementCategory category, AchievementAward award, boolean includeParticipation) {
    int awardPoints = awardPoints(category, award);
    int participation = participationPoints(category, includeParticipation);
    if (includeParticipation && participation == 0) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("Participation points are not defined for this category");
    }
    if (awardPoints + participation == 0) {
      throw ErrorCode.VALIDATION_ERROR.throwIt("An award or supported participation claim is required");
    }
  }
}
