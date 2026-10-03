package me.nghlong3004.olympic.recognition.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.recognition.enums.AchievementStatus;
import me.nghlong3004.olympic.recognition.request.ReviewAchievementRequest;
import me.nghlong3004.olympic.recognition.request.SaveHonorRequest;
import me.nghlong3004.olympic.recognition.request.SubmitAchievementRequest;
import me.nghlong3004.olympic.recognition.response.AchievementResponse;
import me.nghlong3004.olympic.recognition.response.HonorResponse;
import me.nghlong3004.olympic.recognition.service.RecognitionService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
@RestController
@RequestMapping("/api/v1/admin/recognition")
@RequiredArgsConstructor
@Tag(name = "Admin recognition", description = "Live administrator honor management and evidence review")
public class AdminRecognitionController {
  private final RecognitionService service;

  @GetMapping("/honors")
  @Operation(summary = "Browse memories including unpublished drafts")
  @ApiResponse(responseCode = "200", description = "Admin memory list")
  public Page<HonorResponse> honors(@RequestParam(required = false) Integer year,
      @RequestParam(required = false) String subject, @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) { return service.listHonors(year, subject, page, size, true); }

  @GetMapping("/honors/{id}")
  @Operation(summary = "Reload a memory and its current version, including drafts")
  @ApiResponse(responseCode = "200", description = "Admin memory detail")
  public HonorResponse honor(@PathVariable UUID id) { return service.getHonor(id, true); }

  @PostMapping("/honors")
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create an honorary memory without awarding points")
  @ApiResponse(responseCode = "201", description = "Memory created")
  public HonorResponse create(@Valid @RequestBody SaveHonorRequest request) { return service.saveHonor(null, request); }

  @PutMapping("/honors/{id}")
  @Operation(summary = "Update or publish a versioned memory")
  @ApiResponse(responseCode = "200", description = "Memory updated")
  public HonorResponse update(@PathVariable UUID id, @Valid @RequestBody SaveHonorRequest request) { return service.saveHonor(id, request); }

  @DeleteMapping("/honors/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Delete a memory and its bounded gallery")
  @ApiResponse(responseCode = "204", description = "Memory deleted")
  public void delete(@PathVariable UUID id) { service.deleteHonor(id); }

  @PostMapping(value = "/honors/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Append image photos to the ordered gallery")
  @ApiResponse(responseCode = "200", description = "Updated gallery and version")
  public HonorResponse addPhotos(@PathVariable UUID id, @RequestPart("files") List<MultipartFile> files) { return service.addPhotos(id, files); }

  @DeleteMapping("/honors/{id}/photos/{photoId}")
  @Operation(summary = "Remove a gallery photo")
  @ApiResponse(responseCode = "200", description = "Updated gallery and version")
  public HonorResponse removePhoto(@PathVariable UUID id, @PathVariable UUID photoId) { return service.removePhoto(id, photoId); }

  @GetMapping("/honors/{id}/photos/{photoId}")
  @Operation(summary = "Read a photo from an unpublished or published memory")
  @ApiResponse(responseCode = "200", description = "Authorized gallery photo")
  public ResponseEntity<byte[]> photo(@PathVariable UUID id, @PathVariable UUID photoId) {
    return RecognitionController.download(service.getPhoto(id, photoId, true), false);
  }

  @GetMapping("/achievements")
  @Operation(summary = "Read pending reviews or confirmed/rejected/revoked history")
  @ApiResponse(responseCode = "200", description = "Private review queue")
  public Page<AchievementResponse> achievements(@RequestParam(required = false) AchievementStatus status,
      @RequestParam(required = false) UUID userId, @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) { return service.adminListAchievements(status, userId, page, size); }

  @PostMapping(value = "/achievements", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Submit evidence on behalf of an active student for review")
  @ApiResponse(responseCode = "201", description = "Pending achievement, never automatic points")
  public AchievementResponse submit(@Valid @RequestPart("metadata") SubmitAchievementRequest metadata,
      @RequestPart("evidence") List<MultipartFile> evidence) { return service.submitAchievement(metadata, evidence, true); }

  @PostMapping("/achievements/{id}/review")
  @Operation(summary = "Approve, reject or revoke using the displayed version")
  @ApiResponse(responseCode = "200", description = "Decision saved; approved totals recomputed from records")
  @ApiResponse(responseCode = "409", description = "Stale review or invalid transition")
  public AchievementResponse review(@PathVariable UUID id, @Valid @RequestBody ReviewAchievementRequest request) {
    return service.reviewAchievement(id, request);
  }
}
