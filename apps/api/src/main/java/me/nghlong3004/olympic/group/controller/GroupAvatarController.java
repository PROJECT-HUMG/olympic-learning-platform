package me.nghlong3004.olympic.group.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.group.request.UpdateGroupAvatarCropRequest;
import me.nghlong3004.olympic.group.response.GroupAvatarResponse;
import me.nghlong3004.olympic.group.service.GroupAvatarService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@RestController
@RequestMapping("/api/v1/groups/{groupId}/avatar")
@RequiredArgsConstructor
@Tag(name = "Daily Group Avatar", description = "Founder edits; active members read private bytes")
public class GroupAvatarController {
  private final GroupAvatarService service;

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Save original group image and profile-compatible framing")
  @ApiResponse(responseCode = "200", description = "Saved by active founder")
  @ApiResponse(responseCode = "403", description = "Not the active founder")
  public GroupAvatarResponse upload(@PathVariable UUID groupId, @RequestPart MultipartFile image,
      @Valid @RequestPart UpdateGroupAvatarCropRequest crop) {
    return service.upload(groupId, image, crop);
  }

  @PutMapping("/{avatarId}/crop")
  @Operation(summary = "Reframe current group image without reuploading")
  @ApiResponse(responseCode = "200", description = "Framing saved")
  @ApiResponse(responseCode = "409", description = "Image replaced in another session")
  public GroupAvatarResponse crop(@PathVariable UUID groupId, @PathVariable UUID avatarId,
      @Valid @RequestBody UpdateGroupAvatarCropRequest crop) {
    return service.crop(groupId, avatarId, crop);
  }

  @DeleteMapping("/{avatarId}")
  @Operation(summary = "Remove current group image, founder only")
  @ApiResponse(responseCode = "204", description = "Image removed")
  @ApiResponse(responseCode = "409", description = "Image replaced in another session")
  public ResponseEntity<Void> remove(@PathVariable UUID groupId, @PathVariable UUID avatarId) {
    service.remove(groupId, avatarId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{avatarId}")
  @Operation(summary = "Read original raster with current group membership")
  @ApiResponse(responseCode = "200", description = "Private no-store image")
  @ApiResponse(responseCode = "403", description = "Membership absent or inactive")
  public ResponseEntity<byte[]> read(@PathVariable UUID groupId, @PathVariable UUID avatarId) {
    var image = service.read(groupId, avatarId);
    return ResponseEntity.ok().cacheControl(CacheControl.noStore())
        .header("X-Content-Type-Options", "nosniff")
        .contentType(MediaType.parseMediaType(image.mediaType())).body(image.content());
  }
}
