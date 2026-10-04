package me.nghlong3004.olympic.daily.evidence.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.daily.evidence.enums.EvidenceStage;
import me.nghlong3004.olympic.daily.evidence.request.CreateEvidenceLinkRequest;
import me.nghlong3004.olympic.daily.evidence.response.EvidenceMetadataResponse;
import me.nghlong3004.olympic.daily.evidence.service.EvidenceService;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@RestController
@RequestMapping("/api/v1/daily/plans/{planId}/tasks/{taskId}/evidence")
@RequiredArgsConstructor
@Tag(name = "Daily evidence", description = "Private saved-task files and links")
public class EvidenceController {
  private final EvidenceService service;

  @GetMapping
  @Operation(summary = "List currently permitted saved-task evidence")
  @ApiResponse(responseCode = "200", description = "Metadata array")
  public ResponseEntity<List<EvidenceMetadataResponse>> list(
      @PathVariable UUID planId,
      @PathVariable UUID taskId,
      @RequestParam(required = false) UUID groupId) {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore())
        .body(service.list(planId, taskId, groupId));
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Create owned FILE evidence without changing the plan")
  @ApiResponse(responseCode = "201", description = "One complete persisted metadata record")
  public ResponseEntity<EvidenceMetadataResponse> file(
      @PathVariable UUID planId,
      @PathVariable UUID taskId,
      @RequestParam EvidenceStage stage,
      @RequestPart MultipartFile file) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .cacheControl(CacheControl.noStore())
        .body(service.createFile(planId, taskId, stage, file));
  }

  @PostMapping("/links")
  @Operation(summary = "Create owned LINK evidence without fetching the URL")
  @ApiResponse(responseCode = "201", description = "One complete persisted metadata record")
  public ResponseEntity<EvidenceMetadataResponse> link(
      @PathVariable UUID planId,
      @PathVariable UUID taskId,
      @Valid @RequestBody CreateEvidenceLinkRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .cacheControl(CacheControl.noStore())
        .body(service.createLink(planId, taskId, request));
  }

  @GetMapping("/{evidenceId}/bytes")
  @Operation(summary = "Download FILE bytes after current permission checks")
  @ApiResponse(responseCode = "200", description = "Original private attachment bytes")
  public ResponseEntity<byte[]> bytes(
      @PathVariable UUID planId,
      @PathVariable UUID taskId,
      @PathVariable UUID evidenceId,
      @RequestParam(required = false) UUID groupId) {
    var download = service.download(planId, taskId, evidenceId, groupId);
    var disposition =
        ContentDisposition.attachment()
            .filename(download.originalName(), StandardCharsets.UTF_8)
            .build();
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore())
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
        .header("X-Content-Type-Options", "nosniff")
        .body(download.content());
  }

  @DeleteMapping("/{evidenceId}")
  @Operation(summary = "Remove owned evidence without changing the plan")
  @ApiResponse(responseCode = "204", description = "Evidence removed")
  public ResponseEntity<Void> remove(
      @PathVariable UUID planId, @PathVariable UUID taskId, @PathVariable UUID evidenceId) {
    service.remove(planId, taskId, evidenceId);
    return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
  }
}
