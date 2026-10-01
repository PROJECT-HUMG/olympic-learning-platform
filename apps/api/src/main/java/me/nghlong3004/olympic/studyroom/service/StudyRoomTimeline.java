package me.nghlong3004.olympic.studyroom.service;

import java.time.Duration;
import java.time.OffsetDateTime;
import me.nghlong3004.olympic.studyroom.entity.StudyRoom;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomPhase;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
public final class StudyRoomTimeline {
  private StudyRoomTimeline() {}

  /** Returns the automatic phase at a server timestamp, with long rests after every fourth focus. */
  public static Phase at(StudyRoom room, OffsetDateTime now) {
    long focus = room.getFocusMinutes() * 60_000L;
    long rest = room.getBreakMinutes() * 60_000L;
    long longRest = room.getLongBreakMinutes() * 60_000L;
    long cycle = 4 * focus + 3 * rest + longRest;
    long elapsed = Math.max(0, Duration.between(room.getCreatedAt(), now).toMillis());
    long cycles = elapsed / cycle;
    long position = elapsed % cycle;
    long start = cycles * cycle;
    for (int index = 0; index < 4; index++) {
      long session = cycles * 4 + index + 1;
      if (position < focus) return new Phase(StudyRoomPhase.FOCUS, room.getCreatedAt().plusNanos((start + focus) * 1_000_000), session);
      position -= focus;
      start += focus;
      long pause = index == 3 ? longRest : rest;
      if (position < pause) return new Phase(index == 3 ? StudyRoomPhase.LONG_BREAK : StudyRoomPhase.BREAK,
          room.getCreatedAt().plusNanos((start + pause) * 1_000_000), session);
      position -= pause;
      start += pause;
    }
    throw new IllegalStateException("Study room phase is outside its cycle");
  }

  /** Counts only the focus overlap; callers enforce the heartbeat lease before awarding credit. */
  public static long focusMillis(StudyRoom room, OffsetDateTime from, OffsetDateTime to) {
    if (!to.isAfter(from)) return 0;
    return focusedUntil(room, to) - focusedUntil(room, from);
  }

  private static long focusedUntil(StudyRoom room, OffsetDateTime time) {
    long focus = room.getFocusMinutes() * 60_000L;
    long rest = room.getBreakMinutes() * 60_000L;
    long cycle = 4 * focus + 3 * rest + room.getLongBreakMinutes() * 60_000L;
    long elapsed = Math.max(0, Duration.between(room.getCreatedAt(), time).toMillis());
    long total = (elapsed / cycle) * 4 * focus;
    long position = elapsed % cycle;
    for (int index = 0; index < 4; index++) {
      total += Math.min(Math.max(position, 0), focus);
      position -= focus + rest;
    }
    return total;
  }

  public record Phase(StudyRoomPhase phase, OffsetDateTime endsAt, long sessionNumber) {}
}
