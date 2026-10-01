package me.nghlong3004.olympic.studyroom.response;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomPhase;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomRequestPolicy;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomTrackStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
public record StudyRoomSnapshotResponse(
    UUID id, String name, UUID ownerId, String ownerName, long activeMembers,
    int focusMinutes, int breakMinutes, int longBreakMinutes,
    StudyRoomRequestPolicy requestPolicy, int minimumStudyMinutes,
    boolean closed, OffsetDateTime serverNow, StudyRoomPhase phase, OffsetDateTime phaseEndsAt,
    long sessionNumber, Playback playback, List<Member> members, Me me, List<Track> tracks) {
  public record Playback(String videoId, String title, OffsetDateTime startedAt, long version, boolean isDefault) {}
  public record Member(UUID userId, String displayName, long focusSeconds, boolean online) {}
  public record Me(UUID userId, long focusSeconds, boolean canRequest, long remainingStudySeconds) {}
  public record Track(UUID id, String videoId, String title, UUID requestedById, String requestedByName,
      StudyRoomTrackStatus status, OffsetDateTime createdAt) {}
}
