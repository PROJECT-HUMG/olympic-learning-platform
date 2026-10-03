package me.nghlong3004.olympic.recognition.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.recognition.dto.RecognitionDownload;
import me.nghlong3004.olympic.recognition.request.SubmitAchievementRequest;
import me.nghlong3004.olympic.recognition.request.UpdateAchievementVisibilityRequest;
import me.nghlong3004.olympic.recognition.request.UpdateRecognitionPreferencesRequest;
import me.nghlong3004.olympic.recognition.response.AchievementResponse;
import me.nghlong3004.olympic.recognition.response.HonorResponse;
import me.nghlong3004.olympic.recognition.response.RankingResponse;
import me.nghlong3004.olympic.recognition.response.RecognitionPreferencesResponse;
import me.nghlong3004.olympic.recognition.response.RecognitionProfileResponse;
import me.nghlong3004.olympic.recognition.service.RecognitionService;
import org.springframework.data.domain.Page;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping("/api/v1/recognition")
@RequiredArgsConstructor
@Tag(name = "Recognition", description = "Honor memories, academic achievement privacy and approved student rankings")
public class RecognitionController {
  private final RecognitionService service;

  @GetMapping("/honors")
  @Operation(summary = "Browse published honor memories")
  @ApiResponse(responseCode = "200", description = "Published memories")
  public Page<HonorResponse> honors(@RequestParam(required = false) Integer year,
      @RequestParam(required = false) String subject, @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) { return service.listHonors(year, subject, page, size, false); }

  @GetMapping("/honors/{id}")
  @Operation(summary = "Read a published memory and its ordered participants")
  @ApiResponse(responseCode = "200", description = "Public memory")
  public HonorResponse honor(@PathVariable UUID id) { return service.getHonor(id, false); }

  @GetMapping("/honors/{id}/photos/{photoId}")
  @Operation(summary = "Read a photo belonging to a published memory")
  @ApiResponse(responseCode = "200", description = "Published photo")
  public ResponseEntity<byte[]> photo(@PathVariable UUID id, @PathVariable UUID photoId) {
    return download(service.getPhoto(id, photoId, false), false);
  }

  @GetMapping("/rankings")
  @Operation(summary = "Read annual or all-time approved points for opted-in active students")
  @ApiResponse(responseCode = "200", description = "Competition ranks; private approved achievements also count")
  public Page<RankingResponse> rankings(@RequestParam(required = false) Integer year,
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
    return service.rankings(year, page, size);
  }

  @GetMapping("/profiles/{userId}")
  @Operation(summary = "Read only public approved academic details, never evidence")
  @ApiResponse(responseCode = "200", description = "Public profile and public-only points")
  public RecognitionProfileResponse profile(@PathVariable UUID userId) { return service.profile(userId); }

  @GetMapping("/achievements/me")
  @Operation(summary = "Read the current student's private achievement and review history")
  @ApiResponse(responseCode = "200", description = "Owned records")
  public List<AchievementResponse> mine() { return service.listMyAchievements(); }

  @PostMapping(value = "/achievements", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Submit academic details with mandatory private image/PDF evidence")
  @ApiResponse(responseCode = "201", description = "Pending review; no points granted yet")
  public AchievementResponse submit(@Valid @RequestPart("metadata") SubmitAchievementRequest metadata,
      @RequestPart("evidence") List<MultipartFile> evidence) { return service.submitAchievement(metadata, evidence, false); }

  @PutMapping(value = "/achievements/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Correct and resubmit an owned nonapproved record with new proof")
  @ApiResponse(responseCode = "200", description = "Pending fresh review")
  public AchievementResponse update(@PathVariable UUID id, @Valid @RequestPart("metadata") SubmitAchievementRequest metadata,
      @RequestPart("evidence") List<MultipartFile> evidence) { return service.updateAchievement(id, metadata, evidence); }

  @PatchMapping("/achievements/{id}/visibility")
  @Operation(summary = "Control public details without changing approved point totals")
  @ApiResponse(responseCode = "200", description = "Privacy saved")
  public AchievementResponse visibility(@PathVariable UUID id, @Valid @RequestBody UpdateAchievementVisibilityRequest request) {
    return service.setVisibility(id, request.publicVisible());
  }

  @GetMapping("/achievements/{id}/evidence/{attachmentId}")
  @Operation(summary = "Download private proof as its active owner or active administrator")
  @ApiResponse(responseCode = "200", description = "Authenticated attachment, never a public storage URL")
  public ResponseEntity<byte[]> evidence(@PathVariable UUID id, @PathVariable UUID attachmentId) {
    return download(service.getEvidence(id, attachmentId), true);
  }

  @GetMapping("/preferences/me")
  @Operation(summary = "Read ranking consent, opt out by default")
  @ApiResponse(responseCode = "200", description = "Consent settings")
  public RecognitionPreferencesResponse preferences() { return service.preferences(); }

  @PatchMapping("/preferences/me")
  @Operation(summary = "Opt in to or out of public rankings")
  @ApiResponse(responseCode = "200", description = "Consent saved")
  public RecognitionPreferencesResponse preferences(@Valid @RequestBody UpdateRecognitionPreferencesRequest request) {
    return service.setPreferences(request.rankingOptIn());
  }

  static ResponseEntity<byte[]> download(RecognitionDownload file, boolean attachment) {
    var disposition = (attachment ? ContentDisposition.attachment() : ContentDisposition.inline())
        .filename(file.originalName(), StandardCharsets.UTF_8).build();
    return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.contentType()))
        .contentLength(file.content().length).cacheControl(CacheControl.noStore())
        .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
        .header("X-Content-Type-Options", "nosniff").body(file.content());
  }
}
