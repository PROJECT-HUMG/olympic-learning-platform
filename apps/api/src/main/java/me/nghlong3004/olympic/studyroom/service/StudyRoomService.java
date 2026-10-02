package me.nghlong3004.olympic.studyroom.service;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.studyroom.request.AdvanceStudyRoomPlaybackRequest;
import me.nghlong3004.olympic.studyroom.request.CreateStudyRoomRequest;
import me.nghlong3004.olympic.studyroom.request.RequestStudyRoomTrackRequest;
import me.nghlong3004.olympic.studyroom.request.TransferStudyRoomOwnershipRequest;
import me.nghlong3004.olympic.studyroom.request.UpdateStudyRoomSettingsRequest;
import me.nghlong3004.olympic.studyroom.request.UpdateStudyRoomRhythmRequest;
import me.nghlong3004.olympic.studyroom.response.StudyRoomSnapshotResponse;
import me.nghlong3004.olympic.studyroom.response.StudyRoomSummaryResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
public interface StudyRoomService {
  /** Lists the latest 50 open rooms for an active authenticated user.
   * @return open-room summaries without private account data
   */
  List<StudyRoomSummaryResponse> list();

  /** Creates a persistent room and joins its owner, leaving their previous selected room.
   * @param request validated initial room settings
   * @return coherent initial snapshot
   */
  StudyRoomSnapshotResponse create(CreateStudyRoomRequest request);

  /** Reads a locked snapshot without accruing study time or joining the caller.
   * @param id room ID
   * @return snapshot, with me null for nonmembers
   */
  StudyRoomSnapshotResponse get(UUID id);

  /** Selects this room, preserving earned study time and leaving any previous selection.
   * @param id room ID
   * @return joined snapshot
   */
  StudyRoomSnapshotResponse join(UUID id);

  /** Awards only server-observed focus overlap within the heartbeat lease.
   * @param id joined room ID
   * @return snapshot after this heartbeat
   */
  StudyRoomSnapshotResponse heartbeat(UUID id);

  /** Transfers ownership from the joined owner to an active online member under database locks.
   * The target may own at most three open rooms; timing, playback and memberships are preserved.
   * @param id open room ID
   * @param request validated target member ID
   * @return updated snapshot for the former owner, who remains a member
   */
  StudyRoomSnapshotResponse transferOwnership(UUID id, TransferStudyRoomOwnershipRequest request);

  /** Idempotently leaves the caller's membership while preserving earned focus time.
   * @param id room ID
   */
  void leave(UUID id);

  /** Updates request permissions; only the joined owner can change settings.
   * @param id room ID
   * @param request validated music request settings
   * @return updated snapshot
   */
  StudyRoomSnapshotResponse settings(UUID id, UpdateStudyRoomSettingsRequest request);

  /** Updates durations and starts a new shared focus cycle under the room lock.
   * @param id open room ID owned by the joined caller
   * @param request validated durations and current rhythm version
   * @return snapshot with a new clock origin; membership, focus credit and music are retained
   */
  StudyRoomSnapshotResponse rhythm(UUID id, UpdateStudyRoomRhythmRequest request);

  /** Closes the room for everyone; only its owner may close it.
   * @param id room ID
   * @return closed snapshot
   */
  StudyRoomSnapshotResponse close(UUID id);

  /** Queues an allowlisted YouTube video; owner requests are approved immediately.
   * @param id room ID
   * @param request validated URL and display title, never fetched by the server
   * @return snapshot with the new pending or approved request
   */
  StudyRoomSnapshotResponse requestTrack(UUID id, RequestStudyRoomTrackRequest request);

  /** Approves a pending track without changing playback; requires the joined owner.
   * @param id room ID
   * @param trackId queued track ID belonging to this room
   * @return updated snapshot
   */
  StudyRoomSnapshotResponse approve(UUID id, UUID trackId);

  /** Removes a queued request; requires the joined owner.
   * @param id room ID
   * @param trackId queued track ID belonging to this room
   * @return updated snapshot
   */
  StudyRoomSnapshotResponse reject(UUID id, UUID trackId);

  /** Advances to the oldest approved track, guarded against duplicate owner commands.
   * @param id room ID
   * @param request current playback version
   * @return updated playback snapshot, falling back to the default stream when the queue is empty
   */
  StudyRoomSnapshotResponse next(UUID id, AdvanceStudyRoomPlaybackRequest request);
}
