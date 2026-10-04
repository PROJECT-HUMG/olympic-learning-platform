package me.nghlong3004.olympic.studyroom;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.studyroom.entity.StudyRoom;
import me.nghlong3004.olympic.studyroom.entity.StudyRoomMember;
import me.nghlong3004.olympic.studyroom.entity.StudyRoomTrack;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomPhase;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomRequestPolicy;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomTrackStatus;
import me.nghlong3004.olympic.studyroom.mapper.StudyRoomMapper;
import me.nghlong3004.olympic.studyroom.response.StudyRoomSnapshotResponse;
import me.nghlong3004.olympic.studyroom.response.StudyRoomSummaryResponse;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.response.AvatarCropResponse;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
class StudyRoomMapperTest {
  private static final OffsetDateTime STARTED = OffsetDateTime.of(2026, 10, 4, 1, 2, 3, 0, ZoneOffset.UTC);
  private static final UUID ROOM_ID = UUID.fromString("00000000-0000-0000-0000-000000002010");
  private static final UUID OWNER_ID = UUID.fromString("00000000-0000-0000-0000-000000002011");
  private static final UUID FIRST_ID = UUID.fromString("00000000-0000-0000-0000-000000002012");
  private static final UUID SECOND_ID = UUID.fromString("00000000-0000-0000-0000-000000002013");
  private final StudyRoomMapper mapper = Mappers.getMapper(StudyRoomMapper.class);

  @Test
  void summaryPlaybackMemberAndTrackMatchTheManualConstructors() {
    var owner = user(OWNER_ID, "Secret", STARTED);
    var room = room(owner);
    var summary = mapper.toSummary(room, "Thành viên HUMG", 0);
    assertThat(summary).isEqualTo(new StudyRoomSummaryResponse(room.getId(), room.getName(), room.getOwner().getId(),
        "Thành viên HUMG", 0, room.getFocusMinutes(), room.getBreakMinutes(), room.getLongBreakMinutes(),
        room.getRequestPolicy(), room.getMinimumStudyMinutes()));

    assertThat(mapper.toPlayback(room)).isEqualTo(new StudyRoomSnapshotResponse.Playback(room.getPlaybackVideoId(),
        room.getPlaybackTitle(), room.getPlaybackStartedAt(), room.getPlaybackVersion(), room.isPlaybackDefault()));
    room.setPlaybackTitle(null);
    room.setPlaybackStartedAt(null);
    room.setPlaybackDefault(false);
    assertThat(mapper.toPlayback(room)).isEqualTo(new StudyRoomSnapshotResponse.Playback(
        room.getPlaybackVideoId(), null, null, room.getPlaybackVersion(), false));

    var crop = new AvatarCropResponse(0.2, 0.8, 2);
    var hidden = member(owner, 10_000);
    var visible = member(user(FIRST_ID, "Chủ phòng", null), 3_000);
    assertThat(mapper.toMember(hidden, "Thành viên HUMG", null, null, 3, false)).isEqualTo(
        new StudyRoomSnapshotResponse.Member(hidden.getUser().getId(), "Thành viên HUMG", null, null, 3, false));
    assertThat(mapper.toMember(visible, "Chủ phòng", "https://example.test/a.png", crop, 3, true)).isEqualTo(
        new StudyRoomSnapshotResponse.Member(visible.getUser().getId(), "Chủ phòng", "https://example.test/a.png", crop, 3, true));

    var first = track(FIRST_ID, "aaa", user(FIRST_ID, "Secret", STARTED));
    var second = track(SECOND_ID, "bbb", user(SECOND_ID, "Chủ phòng", null));
    var tracks = List.of(first, second).stream().map(item -> mapper.toTrack(item, "Thành viên HUMG")).toList();
    assertThat(tracks.stream().map(StudyRoomSnapshotResponse.Track::id).toList()).containsExactly(first.getId(), second.getId());
    assertThat(tracks.getFirst()).isEqualTo(new StudyRoomSnapshotResponse.Track(first.getId(), first.getVideoId(),
        first.getTitle(), first.getRequestedBy().getId(), "Thành viên HUMG", first.getStatus(), first.getCreatedAt()));
  }

  @Test
  void snapshotKeepsOrderNullMeAndEmptyCollections() {
    var owner = user(OWNER_ID, "Secret", STARTED);
    var room = room(owner);
    var playback = mapper.toPlayback(room);
    var members = List.of(
        mapper.toMember(member(user(FIRST_ID, "A", null), 1), "A", null, null, 1, true),
        mapper.toMember(member(user(SECOND_ID, "B", null), 1), "B", null, null, 2, false));
    var tracks = List.of(mapper.toTrack(track(FIRST_ID, "aaa", owner), "Thành viên HUMG"));
    var ends = STARTED.plusMinutes(20);
    var actual = mapper.toSnapshot(room, "Thành viên HUMG", 6, STARTED, StudyRoomPhase.LONG_BREAK, ends, 4,
        playback, members, null, tracks);
    assertThat(actual).isEqualTo(new StudyRoomSnapshotResponse(room.getId(), room.getName(), room.getOwner().getId(),
        "Thành viên HUMG", 6, room.getFocusMinutes(), room.getBreakMinutes(), room.getLongBreakMinutes(),
        room.getRequestPolicy(), room.getMinimumStudyMinutes(), room.isClosed(), STARTED, StudyRoomPhase.LONG_BREAK,
        ends, 4, room.getRhythmVersion(), playback, members, null, tracks));
    assertThat(actual.members().stream().map(StudyRoomSnapshotResponse.Member::userId).toList())
        .containsExactly(FIRST_ID, SECOND_ID);
    assertThat(actual.members()).isSameAs(members);
    assertThat(actual.tracks()).isSameAs(tracks);

    var empty = mapper.toSnapshot(room, "Thành viên HUMG", 0, STARTED, StudyRoomPhase.FOCUS, ends, 1,
        playback, List.of(), null, List.of());
    assertThat(empty.members()).isEmpty();
    assertThat(empty.tracks()).isEmpty();
    assertThat(empty.me()).isNull();
    assertThat(empty.activeMembers()).isZero();
  }

  private static StudyRoom room(User owner) {
    return StudyRoom.builder().id(ROOM_ID).owner(owner).name("Cùng học").focusMinutes(50).breakMinutes(10)
        .longBreakMinutes(20).requestPolicy(StudyRoomRequestPolicy.HOST_ONLY).minimumStudyMinutes(12).closed(true)
        .rhythmVersion(8).playbackVideoId("jfKfPfyJRdk").playbackTitle("Lofi Girl").playbackStartedAt(STARTED)
        .playbackVersion(4).playbackDefault(true).build();
  }

  private static StudyRoomMember member(User user, long focusMillis) {
    return StudyRoomMember.builder().user(user).focusMillis(focusMillis).build();
  }

  private static StudyRoomTrack track(UUID id, String videoId, User requestedBy) {
    return StudyRoomTrack.builder().id(id).videoId(videoId).title("Nhạc học bài").requestedBy(requestedBy)
        .status(StudyRoomTrackStatus.PENDING).createdAt(STARTED).build();
  }

  private static User user(UUID id, String fullName, OffsetDateTime deletedAt) {
    return User.builder().id(id).fullName(fullName).email(id + "@test.invalid").deletedAt(deletedAt).build();
  }
}
