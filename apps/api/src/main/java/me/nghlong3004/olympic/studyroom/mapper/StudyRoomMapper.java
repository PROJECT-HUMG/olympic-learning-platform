package me.nghlong3004.olympic.studyroom.mapper;

import java.time.OffsetDateTime;
import java.util.List;
import me.nghlong3004.olympic.studyroom.entity.StudyRoom;
import me.nghlong3004.olympic.studyroom.entity.StudyRoomMember;
import me.nghlong3004.olympic.studyroom.entity.StudyRoomTrack;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomPhase;
import me.nghlong3004.olympic.studyroom.response.StudyRoomSnapshotResponse;
import me.nghlong3004.olympic.studyroom.response.StudyRoomSummaryResponse;
import me.nghlong3004.olympic.user.response.AvatarCropResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * Structural study-room responses. Names, avatar URIs, crops, focus, presence, permissions,
 * counts, and timeline phase stay in the study-room service.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface StudyRoomMapper {

  @Mapping(target = "id", source = "room.id")
  @Mapping(target = "name", source = "room.name")
  @Mapping(target = "ownerId", expression = "java(room.getOwner().getId())")
  @Mapping(target = "ownerName", source = "ownerName")
  @Mapping(target = "activeMembers", source = "activeMembers")
  @Mapping(target = "focusMinutes", source = "room.focusMinutes")
  @Mapping(target = "breakMinutes", source = "room.breakMinutes")
  @Mapping(target = "longBreakMinutes", source = "room.longBreakMinutes")
  @Mapping(target = "requestPolicy", source = "room.requestPolicy")
  @Mapping(target = "minimumStudyMinutes", source = "room.minimumStudyMinutes")
  StudyRoomSummaryResponse toSummary(StudyRoom room, String ownerName, long activeMembers);

  @Mapping(target = "id", source = "room.id")
  @Mapping(target = "name", source = "room.name")
  @Mapping(target = "ownerId", expression = "java(room.getOwner().getId())")
  @Mapping(target = "ownerName", source = "ownerName")
  @Mapping(target = "activeMembers", source = "activeMembers")
  @Mapping(target = "focusMinutes", source = "room.focusMinutes")
  @Mapping(target = "breakMinutes", source = "room.breakMinutes")
  @Mapping(target = "longBreakMinutes", source = "room.longBreakMinutes")
  @Mapping(target = "requestPolicy", source = "room.requestPolicy")
  @Mapping(target = "minimumStudyMinutes", source = "room.minimumStudyMinutes")
  @Mapping(target = "closed", source = "room.closed")
  @Mapping(target = "serverNow", source = "serverNow")
  @Mapping(target = "phase", source = "phase")
  @Mapping(target = "phaseEndsAt", source = "phaseEndsAt")
  @Mapping(target = "sessionNumber", source = "sessionNumber")
  @Mapping(target = "rhythmVersion", source = "room.rhythmVersion")
  @Mapping(target = "playback", source = "playback")
  @Mapping(target = "members", expression = "java(members)")
  @Mapping(target = "me", source = "me")
  @Mapping(target = "tracks", expression = "java(tracks)")
  StudyRoomSnapshotResponse toSnapshot(
      StudyRoom room, String ownerName, long activeMembers, OffsetDateTime serverNow, StudyRoomPhase phase,
      OffsetDateTime phaseEndsAt, long sessionNumber, StudyRoomSnapshotResponse.Playback playback,
      List<StudyRoomSnapshotResponse.Member> members, StudyRoomSnapshotResponse.Me me,
      List<StudyRoomSnapshotResponse.Track> tracks);

  @Mapping(target = "videoId", source = "playbackVideoId")
  @Mapping(target = "title", source = "playbackTitle")
  @Mapping(target = "startedAt", source = "playbackStartedAt")
  @Mapping(target = "version", source = "playbackVersion")
  @Mapping(target = "isDefault", source = "playbackDefault")
  StudyRoomSnapshotResponse.Playback toPlayback(StudyRoom room);

  @Mapping(target = "userId", expression = "java(member.getUser().getId())")
  @Mapping(target = "displayName", source = "displayName")
  @Mapping(target = "avatarUrl", source = "avatarUrl")
  @Mapping(target = "avatarCrop", source = "avatarCrop")
  @Mapping(target = "focusSeconds", source = "focusSeconds")
  @Mapping(target = "online", source = "online")
  StudyRoomSnapshotResponse.Member toMember(
      StudyRoomMember member, String displayName, String avatarUrl, AvatarCropResponse avatarCrop,
      long focusSeconds, boolean online);

  @Mapping(target = "id", source = "track.id")
  @Mapping(target = "videoId", source = "track.videoId")
  @Mapping(target = "title", source = "track.title")
  @Mapping(target = "requestedById", expression = "java(track.getRequestedBy().getId())")
  @Mapping(target = "requestedByName", source = "requestedByName")
  @Mapping(target = "status", source = "track.status")
  @Mapping(target = "createdAt", source = "track.createdAt")
  StudyRoomSnapshotResponse.Track toTrack(StudyRoomTrack track, String requestedByName);
}
