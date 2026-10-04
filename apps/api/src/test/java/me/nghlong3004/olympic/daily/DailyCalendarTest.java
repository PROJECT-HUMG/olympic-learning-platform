package me.nghlong3004.olympic.daily;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import me.nghlong3004.olympic.daily.service.DailyCalendar;
import org.junit.jupiter.api.Test;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
class DailyCalendarTest {
  @Test
  void platformMidnightDoesNotFollowServerOrBrowserLocation() {
    var before = Instant.parse("2026-10-04T16:59:59.999999999Z");
    var midnight = Instant.parse("2026-10-04T17:00:00Z");
    for (var zone : new String[] {"UTC", "America/Los_Angeles", "Asia/Tokyo"}) {
      assertThat(DailyCalendar.today(Clock.fixed(before, ZoneId.of(zone))))
          .isEqualTo(LocalDate.of(2026, 10, 4));
      assertThat(DailyCalendar.today(Clock.fixed(midnight, ZoneId.of(zone))))
          .isEqualTo(LocalDate.of(2026, 10, 5));
    }
  }

  @Test
  void weeksStartMondayAndEndSundayAcrossMonthAndYearBoundaries() {
    assertThat(DailyCalendar.weekStart(LocalDate.of(2026, 10, 4)))
        .isEqualTo(LocalDate.of(2026, 9, 28));
    assertThat(DailyCalendar.weekStart(LocalDate.of(2026, 10, 5)))
        .isEqualTo(LocalDate.of(2026, 10, 5));
    assertThat(DailyCalendar.weekStart(LocalDate.of(2027, 1, 1)))
        .isEqualTo(LocalDate.of(2026, 12, 28));
  }

  @Test
  void submissionCutoffIs0730PlatformTimeAndUsesInstantComparison() {
    var date = LocalDate.of(2026, 10, 4);
    var cutoff = DailyCalendar.cutoff(date);
    assertThat(cutoff).isEqualTo(OffsetDateTime.parse("2026-10-04T07:30:00+07:00"));
    assertThat(cutoff.toInstant()).isEqualTo(Instant.parse("2026-10-04T00:30:00Z"));
    assertThat(DailyCalendar.onTime(date, cutoff.minusNanos(1))).isTrue();
    assertThat(DailyCalendar.onTime(date, OffsetDateTime.parse("2026-10-04T00:30:00Z")))
        .isTrue();
    assertThat(DailyCalendar.onTime(date, cutoff.plusNanos(1))).isFalse();
    assertThat(DailyCalendar.onTime(date, null)).isFalse();
  }
}
