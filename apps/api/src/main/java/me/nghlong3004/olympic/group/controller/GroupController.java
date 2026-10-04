package me.nghlong3004.olympic.group.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.group.request.*;
import me.nghlong3004.olympic.group.response.*;
import me.nghlong3004.olympic.group.service.GroupService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
@Tag(name = "Daily Groups", description = "Explicit identified consent and own sharing")
public class GroupController {
  private final GroupService service;

  @GetMapping
  @Operation(summary = "List own active groups")
  @ApiResponse(responseCode = "200")
  public List<GroupSummaryResponse> list() {
    return service.list();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create default-OFF group")
  @ApiResponse(responseCode = "201")
  public GroupSummaryResponse create(@Valid @RequestBody CreateGroupRequest request) {
    return service.create(request);
  }

  @GetMapping("/{groupId}")
  @Operation(summary = "Read active member identities and own sharing")
  @ApiResponse(responseCode = "200")
  public GroupDetailResponse detail(@PathVariable UUID groupId) {
    return service.detail(groupId);
  }

  @PutMapping("/{groupId}/sharing")
  @Operation(summary = "Atomically replace own consent and audience")
  @ApiResponse(responseCode = "200")
  public GroupSharingResponse sharing(
      @PathVariable UUID groupId, @Valid @RequestBody ReplaceGroupSharingRequest request) {
    return service.replaceSharing(groupId, request);
  }

  @PostMapping("/{groupId}/leave")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Leave and revoke own membership")
  @ApiResponse(responseCode = "204")
  public void leave(@PathVariable UUID groupId) {
    service.leave(groupId);
  }

  @PostMapping("/{groupId}/invitations")
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Founder invites identified username")
  @ApiResponse(responseCode = "201")
  public GroupInvitationResponse invite(
      @PathVariable UUID groupId, @Valid @RequestBody CreateGroupInvitationRequest request) {
    return service.invite(groupId, request);
  }

  @GetMapping("/invitations")
  @Operation(summary = "List own pending invitations")
  @ApiResponse(responseCode = "200")
  public List<GroupInvitationResponse> invitations() {
    return service.invitations();
  }

  @PostMapping("/invitations/{invitationId}/accept")
  @Operation(summary = "Explicit target acceptance default-OFF")
  @ApiResponse(responseCode = "200")
  public GroupSummaryResponse accept(@PathVariable UUID invitationId) {
    return service.accept(invitationId);
  }

  @PostMapping("/invitations/{invitationId}/decline")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Explicit target decline")
  @ApiResponse(responseCode = "204")
  public void decline(@PathVariable UUID invitationId) {
    service.decline(invitationId);
  }
}
