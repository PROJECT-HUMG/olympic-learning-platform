package me.nghlong3004.olympic.studyroom.service.impl;

import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.studyroom.entity.StudyRoom;
import me.nghlong3004.olympic.studyroom.entity.StudyRoomMember;
import me.nghlong3004.olympic.studyroom.entity.StudyRoomTrack;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomRequestPolicy;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomTrackStatus;
import me.nghlong3004.olympic.studyroom.repository.StudyRoomMemberRepository;
import me.nghlong3004.olympic.studyroom.repository.StudyRoomRepository;
import me.nghlong3004.olympic.studyroom.repository.StudyRoomTrackRepository;
import me.nghlong3004.olympic.studyroom.request.AdvanceStudyRoomPlaybackRequest;
import me.nghlong3004.olympic.studyroom.request.CreateStudyRoomRequest;
import me.nghlong3004.olympic.studyroom.request.RequestStudyRoomTrackRequest;
import me.nghlong3004.olympic.studyroom.request.UpdateStudyRoomSettingsRequest;
import me.nghlong3004.olympic.studyroom.response.StudyRoomSnapshotResponse;
import me.nghlong3004.olympic.studyroom.response.StudyRoomSummaryResponse;
import me.nghlong3004.olympic.studyroom.service.StudyRoomService;
import me.nghlong3004.olympic.studyroom.service.StudyRoomTimeline;
import me.nghlong3004.olympic.studyroom.service.StudyRoomYoutube;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StudyRoomServiceImpl implements StudyRoomService {
  private static final String DEFAULT_VIDEO_ID = "jfKfPfyJRdk";
  private static final String DEFAULT_TITLE = "Lofi Girl · beats to relax/study to";
  private static final int MAX_MEMBERS = 50;
  private static final int MAX_TRACKS = 50;
  private static final long HEARTBEAT_GRACE_SECONDS = 30;
  private static final long MEMBERSHIP_LEASE_SECONDS = 120;

  private final StudyRoomRepository roomRepository;
  private final StudyRoomMemberRepository memberRepository;
  private final StudyRoomTrackRepository trackRepository;
  private final UserRepository userRepository;
  private final CurrentUserProvider currentUserProvider;
  private final Clock clock;

  @Transactional(readOnly = true)
  @Override
  public List<StudyRoomSummaryResponse> list() {
    currentUser(false);
    var now = OffsetDateTime.now(clock);
    return roomRepository.findFirst50ByClosedFalseOrderByCreatedAtDesc().stream()
        .map(room -> new StudyRoomSummaryResponse(room.getId(), room.getName(), room.getOwner().getId(),
            displayName(room.getOwner()), memberRepository.countByRoomIdAndJoinedTrueAndLastSeenGreaterThanEqual(
                room.getId(), now.minusSeconds(HEARTBEAT_GRACE_SECONDS)), room.getFocusMinutes(),
            room.getBreakMinutes(), room.getLongBreakMinutes(), room.getRequestPolicy(), room.getMinimumStudyMinutes()))
        .toList();
  }

  @Transactional
  @Override
  public StudyRoomSnapshotResponse create(CreateStudyRoomRequest request) {
    var user = currentUser(true);
    if (roomRepository.countByOwnerIdAndClosedFalse(user.getId()) >= 3) {
      throw ErrorCode.STUDY_ROOM_CONFLICT.throwIt("Bạn đã có 3 phòng đang mở. Đóng một phòng trước khi tạo thêm.");
    }
    var previous = memberRepository.findJoinedRoomIdByUserId(user.getId()).map(this::lockRoom);
    var now = OffsetDateTime.now(clock);
    previous.ifPresent(room -> detach(room, user.getId(), now));
    memberRepository.flush();
    var room = roomRepository.save(StudyRoom.builder().owner(user).name(request.name().trim())
        .focusMinutes(request.focusMinutes()).breakMinutes(request.breakMinutes())
        .longBreakMinutes(request.longBreakMinutes()).requestPolicy(request.requestPolicy())
        .minimumStudyMinutes(request.minimumStudyMinutes()).createdAt(now)
        .playbackVideoId(DEFAULT_VIDEO_ID).playbackTitle(DEFAULT_TITLE).playbackStartedAt(now)
        .playbackDefault(true).build());
    memberRepository.save(StudyRoomMember.builder().room(room).user(user).joined(true)
        .joinedAt(now).lastSeen(now).build());
    log.info("Study room created: roomId={}, ownerId={}", room.getId(), user.getId());
    return snapshot(room, user.getId(), now);
  }

  @Transactional
  @Override
  public StudyRoomSnapshotResponse get(UUID id) {
    var user = currentUser(false);
    var room = lockRoom(id);
    return snapshot(room, user.getId(), OffsetDateTime.now(clock));
  }

  @Transactional
  @Override
  public StudyRoomSnapshotResponse join(UUID id) {
    var user = currentUser(true);
    // Project only the old ID before locking: never reuse a membership entity loaded before its room lock.
    UUID previousId = memberRepository.findJoinedRoomIdByUserId(user.getId()).orElse(null);
    var ids = new ArrayList<>(List.of(id));
    if (previousId != null && !previousId.equals(id)) ids.add(previousId);
    ids.sort(Comparator.naturalOrder());
    var rooms = ids.stream().map(this::lockRoom).toList();
    var room = rooms.stream().filter(candidate -> candidate.getId().equals(id)).findFirst().orElseThrow();
    requireOpen(room);
    var now = OffsetDateTime.now(clock);
    var joined = memberRepository.findAllByRoomIdAndJoinedTrueOrderByJoinedAtAsc(id);
    joined.stream().filter(member -> !leased(member, now)).forEach(member -> member.setJoined(false));
    var member = memberRepository.findByRoomIdAndUserId(id, user.getId()).orElse(null);
    if ((member == null || !member.isJoined()) && joined.stream().filter(StudyRoomMember::isJoined).count() >= MAX_MEMBERS) {
      throw ErrorCode.STUDY_ROOM_CONFLICT.throwIt("Phòng đã đủ 50 thành viên. Hãy chọn phòng khác.");
    }
    if (previousId != null && !previousId.equals(id)) {
      var previous = rooms.stream().filter(candidate -> candidate.getId().equals(previousId)).findFirst().orElseThrow();
      detach(previous, user.getId(), now);
    }
    // Flush old selections before inserting/reactivating the new one (partial unique index).
    memberRepository.flush();
    if (member == null) {
      memberRepository.save(StudyRoomMember.builder().room(room).user(user).joined(true).joinedAt(now).lastSeen(now).build());
    } else {
      if (member.isJoined()) accrue(room, member, now);
      else member.setLastSeen(now);
      member.setJoined(true);
      member.setJoinedAt(now);
    }
    return snapshot(room, user.getId(), now);
  }

  @Transactional
  @Override
  public StudyRoomSnapshotResponse heartbeat(UUID id) {
    var user = currentUser(true);
    var room = lockRoom(id);
    requireOpen(room);
    var now = OffsetDateTime.now(clock);
    var member = requireJoined(room, user.getId(), now);
    accrue(room, member, now);
    return snapshot(room, user.getId(), now);
  }

  @Transactional
  @Override
  public void leave(UUID id) {
    var user = currentUser(true);
    var room = lockRoom(id);
    detach(room, user.getId(), OffsetDateTime.now(clock));
  }

  @Transactional
  @Override
  public StudyRoomSnapshotResponse settings(UUID id, UpdateStudyRoomSettingsRequest request) {
    var user = currentUser(true);
    var room = lockRoom(id);
    var now = OffsetDateTime.now(clock);
    requireOwner(room, user.getId(), now);
    room.setRequestPolicy(request.requestPolicy());
    room.setMinimumStudyMinutes(request.minimumStudyMinutes());
    log.info("Study room policy changed: roomId={}, ownerId={}", id, user.getId());
    return snapshot(room, user.getId(), now);
  }

  @Transactional
  @Override
  public StudyRoomSnapshotResponse close(UUID id) {
    var user = currentUser(true);
    var room = lockRoom(id);
    var now = OffsetDateTime.now(clock);
    if (!room.getOwner().getId().equals(user.getId())) throw ErrorCode.STUDY_ROOM_FORBIDDEN.throwIt("Chỉ chủ phòng được đóng phòng.");
    if (!room.isClosed()) {
      requireJoined(room, user.getId(), now);
      for (var member : memberRepository.findAllByRoomIdAndJoinedTrueOrderByJoinedAtAsc(id)) {
        accrue(room, member, now);
        member.setJoined(false);
      }
      room.setClosed(true);
      room.setClosedAt(now);
      log.info("Study room closed: roomId={}, ownerId={}", id, user.getId());
    }
    return snapshot(room, user.getId(), now);
  }

  @Transactional
  @Override
  public StudyRoomSnapshotResponse requestTrack(UUID id, RequestStudyRoomTrackRequest request) {
    var user = currentUser(true);
    var room = lockRoom(id);
    requireOpen(room);
    var now = OffsetDateTime.now(clock);
    var member = requireJoined(room, user.getId(), now);
    var tracks = trackRepository.findAllByRoomIdOrderByCreatedAtAscIdAsc(id);
    if (!policyAllows(room, member)) throw ErrorCode.STUDY_ROOM_FORBIDDEN.throwIt(
        room.getRequestPolicy() == StudyRoomRequestPolicy.HOST_ONLY ? "Phòng này chỉ cho phép chủ phòng chọn nhạc." : "Bạn chưa đủ thời gian tập trung để yêu cầu nhạc.");
    if (tracks.stream().anyMatch(track -> track.getRequestedBy().getId().equals(user.getId()))) {
      throw ErrorCode.STUDY_ROOM_CONFLICT.throwIt("Bạn đã có một bài đang chờ. Đợi bài đó phát hoặc được chủ phòng gỡ trước khi gửi tiếp.");
    }
    if (tracks.size() >= MAX_TRACKS) throw ErrorCode.STUDY_ROOM_CONFLICT.throwIt("Hàng đợi đã đủ 50 bài. Hãy thử lại sau.");
    String videoId = StudyRoomYoutube.videoId(request.youtubeUrl());
    trackRepository.save(StudyRoomTrack.builder().room(room).requestedBy(user).videoId(videoId)
        .title(request.title().trim()).createdAt(now).status(room.getOwner().getId().equals(user.getId())
            ? StudyRoomTrackStatus.APPROVED : StudyRoomTrackStatus.PENDING).build());
    return snapshot(room, user.getId(), now);
  }

  @Transactional
  @Override
  public StudyRoomSnapshotResponse approve(UUID id, UUID trackId) {
    var user = currentUser(true);
    var room = lockRoom(id);
    var now = OffsetDateTime.now(clock);
    requireOwner(room, user.getId(), now);
    requireTrack(id, trackId).setStatus(StudyRoomTrackStatus.APPROVED);
    return snapshot(room, user.getId(), now);
  }

  @Transactional
  @Override
  public StudyRoomSnapshotResponse reject(UUID id, UUID trackId) {
    var user = currentUser(true);
    var room = lockRoom(id);
    var now = OffsetDateTime.now(clock);
    requireOwner(room, user.getId(), now);
    trackRepository.delete(requireTrack(id, trackId));
    return snapshot(room, user.getId(), now);
  }

  @Transactional
  @Override
  public StudyRoomSnapshotResponse next(UUID id, AdvanceStudyRoomPlaybackRequest request) {
    var user = currentUser(true);
    var room = lockRoom(id);
    var now = OffsetDateTime.now(clock);
    requireOwner(room, user.getId(), now);
    if (room.getPlaybackVersion() != request.expectedVersion()) {
      throw ErrorCode.STUDY_ROOM_CONFLICT.throwIt("Bài nhạc đã được đổi ở nơi khác. Hãy dùng trạng thái mới nhất của phòng.");
    }
    var next = trackRepository.findAllByRoomIdOrderByCreatedAtAscIdAsc(id).stream()
        .filter(track -> track.getStatus() == StudyRoomTrackStatus.APPROVED).findFirst();
    room.setPlaybackVideoId(next.map(StudyRoomTrack::getVideoId).orElse(DEFAULT_VIDEO_ID));
    room.setPlaybackTitle(next.map(StudyRoomTrack::getTitle).orElse(DEFAULT_TITLE));
    room.setPlaybackDefault(next.isEmpty());
    room.setPlaybackStartedAt(now);
    room.setPlaybackVersion(room.getPlaybackVersion() + 1);
    next.ifPresent(trackRepository::delete);
    return snapshot(room, user.getId(), now);
  }

  private User currentUser(boolean lock) {
    UUID id = currentUserProvider.getCurrentUser().id();
    var user = (lock ? userRepository.findForUpdateById(id) : userRepository.findByIdAndDeletedAtIsNull(id))
        .orElseThrow(ErrorCode.USER_NOT_FOUND::throwIt);
    user.requireActiveForAuth();
    return user;
  }

  private StudyRoom lockRoom(UUID id) {
    return roomRepository.findForUpdateById(id).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
  }

  private void requireOpen(StudyRoom room) {
    if (room.isClosed()) throw ErrorCode.STUDY_ROOM_CONFLICT.throwIt("Phòng đã đóng. Bạn có thể chọn hoặc tạo phòng khác.");
  }

  private StudyRoomMember requireJoined(StudyRoom room, UUID userId, OffsetDateTime now) {
    return memberRepository.findByRoomIdAndUserId(room.getId(), userId).filter(member -> leased(member, now))
        .orElseThrow(() -> ErrorCode.STUDY_ROOM_FORBIDDEN.throwIt("Bạn cần vào lại phòng trước khi thực hiện thao tác này."));
  }

  private void requireOwner(StudyRoom room, UUID userId, OffsetDateTime now) {
    requireOpen(room);
    if (!room.getOwner().getId().equals(userId)) throw ErrorCode.STUDY_ROOM_FORBIDDEN.throwIt("Chỉ chủ phòng được thực hiện thao tác này.");
    requireJoined(room, userId, now);
  }

  private StudyRoomTrack requireTrack(UUID roomId, UUID trackId) {
    return trackRepository.findByIdAndRoomId(trackId, roomId).orElseThrow(ErrorCode.RESOURCE_NOT_FOUND::throwIt);
  }

  private boolean leased(StudyRoomMember member, OffsetDateTime now) {
    return member.isJoined() && !member.getLastSeen().isBefore(now.minusSeconds(MEMBERSHIP_LEASE_SECONDS));
  }

  private boolean online(StudyRoomMember member, OffsetDateTime now) {
    return member.isJoined() && !member.getLastSeen().isBefore(now.minusSeconds(HEARTBEAT_GRACE_SECONDS));
  }

  private void accrue(StudyRoom room, StudyRoomMember member, OffsetDateTime now) {
    if (!member.isJoined() || room.isClosed() || !now.isAfter(member.getLastSeen())) return;
    long elapsed = Duration.between(member.getLastSeen(), now).toMillis();
    if (elapsed <= HEARTBEAT_GRACE_SECONDS * 1000) {
      member.setFocusMillis(member.getFocusMillis() + StudyRoomTimeline.focusMillis(room, member.getLastSeen(), now));
    }
    member.setLastSeen(now);
  }

  private void detach(StudyRoom room, UUID userId, OffsetDateTime now) {
    memberRepository.findByRoomIdAndUserId(room.getId(), userId).filter(StudyRoomMember::isJoined).ifPresent(member -> {
      accrue(room, member, now);
      member.setJoined(false);
    });
  }

  private boolean policyAllows(StudyRoom room, StudyRoomMember member) {
    if (room.getOwner().getId().equals(member.getUser().getId())) return true;
    return switch (room.getRequestPolicy()) {
      case OPEN -> true;
      case HOST_ONLY -> false;
      case AFTER_FOCUS -> member.getFocusMillis() >= room.getMinimumStudyMinutes() * 60_000L;
    };
  }

  private String displayName(User user) {
    return user.getDeletedAt() == null && user.getFullName() != null && !user.getFullName().isBlank()
        ? user.getFullName() : "Thành viên HUMG";
  }

  private StudyRoomSnapshotResponse snapshot(StudyRoom room, UUID userId, OffsetDateTime now) {
    var members = memberRepository.findAllByRoomIdAndJoinedTrueOrderByJoinedAtAsc(room.getId()).stream()
        .filter(member -> !room.isClosed() && leased(member, now)).toList();
    var tracks = trackRepository.findAllByRoomIdOrderByCreatedAtAscIdAsc(room.getId());
    var me = members.stream().filter(member -> member.getUser().getId().equals(userId)).findFirst().map(member -> {
      boolean pending = tracks.stream().anyMatch(track -> track.getRequestedBy().getId().equals(userId));
      long remaining = room.getRequestPolicy() == StudyRoomRequestPolicy.AFTER_FOCUS && !room.getOwner().getId().equals(userId)
          ? Math.max(0, room.getMinimumStudyMinutes() * 60_000L - member.getFocusMillis()) : 0;
      return new StudyRoomSnapshotResponse.Me(userId, member.getFocusMillis() / 1000,
          policyAllows(room, member) && !pending && tracks.size() < MAX_TRACKS, (remaining + 999) / 1000);
    }).orElse(null);
    var phase = StudyRoomTimeline.at(room, room.isClosed() ? room.getClosedAt() : now);
    return new StudyRoomSnapshotResponse(room.getId(), room.getName(), room.getOwner().getId(), displayName(room.getOwner()),
        members.stream().filter(member -> online(member, now)).count(), room.getFocusMinutes(), room.getBreakMinutes(),
        room.getLongBreakMinutes(), room.getRequestPolicy(), room.getMinimumStudyMinutes(), room.isClosed(), now,
        phase.phase(), phase.endsAt(), phase.sessionNumber(),
        new StudyRoomSnapshotResponse.Playback(room.getPlaybackVideoId(), room.getPlaybackTitle(), room.getPlaybackStartedAt(),
            room.getPlaybackVersion(), room.isPlaybackDefault()),
        members.stream().map(member -> new StudyRoomSnapshotResponse.Member(member.getUser().getId(), displayName(member.getUser()),
            member.getFocusMillis() / 1000, online(member, now))).toList(), me,
        tracks.stream().map(track -> new StudyRoomSnapshotResponse.Track(track.getId(), track.getVideoId(), track.getTitle(),
            track.getRequestedBy().getId(), displayName(track.getRequestedBy()), track.getStatus(), track.getCreatedAt())).toList());
  }
}
