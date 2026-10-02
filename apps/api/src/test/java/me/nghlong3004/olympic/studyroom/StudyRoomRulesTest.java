package me.nghlong3004.olympic.studyroom;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.OffsetDateTime;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.studyroom.entity.StudyRoom;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomPhase;
import me.nghlong3004.olympic.studyroom.service.StudyRoomTimeline;
import me.nghlong3004.olympic.studyroom.service.StudyRoomYoutube;
import org.junit.jupiter.api.Test;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/1/2026
 */
class StudyRoomRulesTest {
  private final OffsetDateTime start = OffsetDateTime.parse("2026-10-01T00:00:00Z");
  private final StudyRoom room = StudyRoom.builder().createdAt(start)
      .focusMinutes(25).breakMinutes(5).longBreakMinutes(15).build();

  @Test
  void transitionsAtExactBoundariesAndRestsLongAfterFourSessions() {
    assertThat(StudyRoomTimeline.at(room, start.plusMinutes(24)).phase()).isEqualTo(StudyRoomPhase.FOCUS);
    assertThat(StudyRoomTimeline.at(room, start.plusMinutes(25)).phase()).isEqualTo(StudyRoomPhase.BREAK);
    assertThat(StudyRoomTimeline.at(room, start.plusMinutes(30)).sessionNumber()).isEqualTo(2);
    assertThat(StudyRoomTimeline.at(room, start.plusMinutes(115)).phase()).isEqualTo(StudyRoomPhase.LONG_BREAK);
    assertThat(StudyRoomTimeline.at(room, start.plusMinutes(115)).endsAt()).isEqualTo(start.plusMinutes(130));
    assertThat(StudyRoomTimeline.at(room, start.plusMinutes(130)).sessionNumber()).isEqualTo(5);
    assertThat(StudyRoomTimeline.at(room, start.plusMinutes(130)).phase()).isEqualTo(StudyRoomPhase.FOCUS);
  }

  @Test
  void creditsOnlyFocusOverlapAcrossBoundariesAndMultipleCycles() {
    assertThat(StudyRoomTimeline.focusMillis(room, start.plusSeconds(1495), start.plusSeconds(1505))).isEqualTo(5000);
    assertThat(StudyRoomTimeline.focusMillis(room, start.plusSeconds(1795), start.plusSeconds(1805))).isEqualTo(5000);
    assertThat(StudyRoomTimeline.focusMillis(room, start, start.plusMinutes(260))).isEqualTo(200 * 60_000L);
    assertThat(StudyRoomTimeline.focusMillis(room, start.plusMinutes(116), start.plusMinutes(120))).isZero();
    assertThat(StudyRoomTimeline.focusMillis(room, start.minusMinutes(10), start.plusMinutes(2))).isEqualTo(120_000);
  }

  @Test
  void acceptsOnlySpecificOfficialHttpsYouTubeVideoLinks() {
    for (String url : new String[] {"https://youtu.be/jfKfPfyJRdk?si=test", "https://www.youtube.com/watch?v=jfKfPfyJRdk&list=test", "https://m.youtube.com/live/jfKfPfyJRdk", "https://youtube.com/embed/jfKfPfyJRdk", "https://youtube.com/v/jfKfPfyJRdk"}) {
      assertThat(StudyRoomYoutube.videoId(url)).isEqualTo("jfKfPfyJRdk");
    }
    for (String url : new String[] {"http://youtube.com/watch?v=jfKfPfyJRdk", "https://youtube.com.evil.test/watch?v=jfKfPfyJRdk", "https://evil@youtube.com/watch?v=jfKfPfyJRdk", "https://youtube.com/playlist?list=test", "https://youtu.be/short", "https://youtube.com/watch?v=jfKfPfyJRdk&v=jfKfPfyJRdk", "https://youtube.com:444/watch?v=jfKfPfyJRdk", "https://youtube.com/embed/extra/jfKfPfyJRdk", "javascript:alert(1)", "https://youtu.be/%6afKfPfyJRdk", "https://youtube.com"}) {
      assertThatThrownBy(() -> StudyRoomYoutube.videoId(url)).as(url).isInstanceOf(ApiException.class);
    }
  }

  @Test
  void aRestartUsesTheNewOriginWithoutRecountingEarlierTime() {
    room.setTimelineStartedAt(start.plusMinutes(10));
    room.setFocusMinutes(50);
    assertThat(StudyRoomTimeline.at(room, start.plusMinutes(10)).sessionNumber()).isEqualTo(1);
    assertThat(StudyRoomTimeline.at(room, start.plusMinutes(10)).endsAt()).isEqualTo(start.plusMinutes(60));
    assertThat(StudyRoomTimeline.focusMillis(room, start.plusMinutes(9), start.plusMinutes(11))).isEqualTo(60_000);
    assertThat(StudyRoomTimeline.focusMillis(room, start, start.plusMinutes(9))).isZero();
  }
}
