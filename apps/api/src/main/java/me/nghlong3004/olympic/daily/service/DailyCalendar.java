package me.nghlong3004.olympic.daily.service;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.Objects;

/**
 * Platform calendar for personal Daily plans. Browser, group, and user locations do not change
 * these boundaries. All submission timestamps are server instants; changing a plan does not create
 * a new first-submission timestamp.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
public final class DailyCalendar {
  public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
  private static final LocalTime SUBMISSION_CUTOFF = LocalTime.of(7, 30);

  private DailyCalendar() {}

  /**
   * Returns the platform day using the injected server clock, regardless of its configured zone.
   *
   * @param clock server clock
   * @return UTC+7 calendar date
   */
  public static LocalDate today(Clock clock) {
    return Objects.requireNonNull(clock).instant().atZone(ZONE).toLocalDate();
  }

  /**
   * Returns the Monday starting the platform calendar week containing a date.
   *
   * @param date platform calendar date
   * @return Monday week start
   */
  public static LocalDate weekStart(LocalDate date) {
    return Objects.requireNonNull(date).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
  }

  /**
   * Returns the single platform submission deadline for a plan date.
   *
   * @param date personal plan calendar date
   * @return deadline at 07:30 UTC+7
   */
  public static OffsetDateTime cutoff(LocalDate date) {
    return Objects.requireNonNull(date).atTime(SUBMISSION_CUTOFF).atZone(ZONE).toOffsetDateTime();
  }

  /**
   * Classifies the first explicit submission, not a later edit timestamp. Late plans remain valid.
   *
   * @param date personal plan calendar date
   * @param firstSubmittedAt first server submission timestamp, or null for an unsubmitted plan
   * @return true when submitted at or before the platform cutoff; false if late or unsubmitted
   */
  public static boolean onTime(LocalDate date, OffsetDateTime firstSubmittedAt) {
    return firstSubmittedAt != null && !firstSubmittedAt.isAfter(cutoff(date));
  }
}
