package me.nghlong3004.olympic.studyroom.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.studyroom.request.AdvanceStudyRoomPlaybackRequest;
import me.nghlong3004.olympic.studyroom.request.CreateStudyRoomRequest;
import me.nghlong3004.olympic.studyroom.request.RequestStudyRoomTrackRequest;
import me.nghlong3004.olympic.studyroom.request.UpdateStudyRoomSettingsRequest;
import me.nghlong3004.olympic.studyroom.response.StudyRoomSnapshotResponse;
import me.nghlong3004.olympic.studyroom.response.StudyRoomSummaryResponse;
import me.nghlong3004.olympic.studyroom.service.StudyRoomService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
@RestController
@RequestMapping("/api/v1/study-rooms")
@RequiredArgsConstructor
@Tag(name = "Study rooms", description = "Shared study phases, presence and moderated music queues")
public class StudyRoomController {
  private final StudyRoomService service;

  @GetMapping
  @Operation(summary = "List the latest open study rooms")
  @ApiResponse(responseCode = "200", description = "Open rooms for an authenticated active user")
  public List<StudyRoomSummaryResponse> list() { return service.list(); }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create a room and join as its owner")
  @ApiResponse(responseCode = "201", description = "Room created")
  public StudyRoomSnapshotResponse create(@Valid @RequestBody CreateStudyRoomRequest request) { return service.create(request); }

  @GetMapping("/{id}")
  @Operation(summary = "Read a coherent room snapshot without joining")
  @ApiResponse(responseCode = "200", description = "Room snapshot")
  public StudyRoomSnapshotResponse get(@PathVariable UUID id) { return service.get(id); }

  @PostMapping("/{id}/join")
  @Operation(summary = "Join this room and leave the previous selected room")
  @ApiResponse(responseCode = "200", description = "Joined snapshot")
  public StudyRoomSnapshotResponse join(@PathVariable UUID id) { return service.join(id); }

  @PostMapping("/{id}/heartbeat")
  @Operation(summary = "Record active focus time using the server clock")
  @ApiResponse(responseCode = "200", description = "Current room snapshot")
  public StudyRoomSnapshotResponse heartbeat(@PathVariable UUID id) { return service.heartbeat(id); }

  @PostMapping("/{id}/leave")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Leave a room while retaining study history")
  @ApiResponse(responseCode = "204", description = "Membership left or already absent")
  public void leave(@PathVariable UUID id) { service.leave(id); }

  @PatchMapping("/{id}/settings")
  @Operation(summary = "Owner changes music request permissions")
  @ApiResponse(responseCode = "200", description = "Updated snapshot")
  public StudyRoomSnapshotResponse settings(@PathVariable UUID id, @Valid @RequestBody UpdateStudyRoomSettingsRequest request) { return service.settings(id, request); }

  @PostMapping("/{id}/close")
  @Operation(summary = "Owner closes a room for all members")
  @ApiResponse(responseCode = "200", description = "Closed snapshot")
  public StudyRoomSnapshotResponse close(@PathVariable UUID id) { return service.close(id); }

  @PostMapping("/{id}/tracks")
  @Operation(summary = "Request one YouTube track according to room policy")
  @ApiResponse(responseCode = "200", description = "Track queued for owner approval")
  public StudyRoomSnapshotResponse requestTrack(@PathVariable UUID id, @Valid @RequestBody RequestStudyRoomTrackRequest request) { return service.requestTrack(id, request); }

  @PostMapping("/{id}/tracks/{trackId}/approve")
  @Operation(summary = "Owner approves a queued track without autoplay")
  @ApiResponse(responseCode = "200", description = "Track approved")
  public StudyRoomSnapshotResponse approve(@PathVariable UUID id, @PathVariable UUID trackId) { return service.approve(id, trackId); }

  @PostMapping("/{id}/tracks/{trackId}/reject")
  @Operation(summary = "Owner removes a pending or approved track")
  @ApiResponse(responseCode = "200", description = "Track removed")
  public StudyRoomSnapshotResponse reject(@PathVariable UUID id, @PathVariable UUID trackId) { return service.reject(id, trackId); }

  @PostMapping("/{id}/playback/next")
  @Operation(summary = "Owner starts the oldest approved track with optimistic playback protection")
  @ApiResponse(responseCode = "200", description = "Playback advanced")
  public StudyRoomSnapshotResponse next(@PathVariable UUID id, @Valid @RequestBody AdvanceStudyRoomPlaybackRequest request) { return service.next(id, request); }
}
