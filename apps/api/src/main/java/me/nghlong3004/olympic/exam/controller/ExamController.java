package me.nghlong3004.olympic.exam.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.exam.dto.ExamFigureDownload;
import me.nghlong3004.olympic.exam.request.PublishExamRequest;
import me.nghlong3004.olympic.exam.request.SaveExamDraftRequest;
import me.nghlong3004.olympic.exam.response.ExamDraftResponse;
import me.nghlong3004.olympic.exam.response.ExamPaperSummaryResponse;
import me.nghlong3004.olympic.exam.response.ExamPaperView;
import me.nghlong3004.olympic.exam.response.StaffExamSolutionResponse;
import me.nghlong3004.olympic.exam.service.ExamService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Prepared-exam HTTP boundary. Paper routes stay literal so they are not read as draft ids.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@RestController
@RequestMapping("/api/v1/exams")
@RequiredArgsConstructor
@Tag(name = "Exams", description = "Prepared exam drafts and frozen papers")
public class ExamController {
  private static final String EXAM =
      "/{examId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}";

  private final ExamService examService;

  @GetMapping
  @Operation(summary = "List drafts owned by the current lecturer, or every draft for an admin")
  @ApiResponse(responseCode = "200", description = "Drafts returned")
  @ApiResponse(responseCode = "403", description = "Staff access required")
  public List<ExamDraftResponse> listDrafts() {
    return examService.listDrafts();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create an owned draft")
  @ApiResponse(responseCode = "201", description = "Draft created")
  @ApiResponse(responseCode = "400", description = "Invalid placement")
  @ApiResponse(responseCode = "403", description = "Staff access required")
  public ExamDraftResponse create(@Valid @RequestBody SaveExamDraftRequest request) {
    return examService.create(request);
  }

  @GetMapping("/papers")
  @Operation(summary = "List published paper summaries")
  @ApiResponse(responseCode = "200", description = "Summaries returned")
  public List<ExamPaperSummaryResponse> listPapers() {
    return examService.listPapers();
  }

  @GetMapping("/papers/{paperId}/figures/{assetId}")
  @Operation(summary = "Read one frozen private figure")
  @ApiResponse(responseCode = "200", description = "Figure bytes")
  @ApiResponse(responseCode = "404", description = "Paper or figure not found")
  public ResponseEntity<byte[]> downloadFigure(@PathVariable UUID paperId, @PathVariable UUID assetId) {
    return figure(examService.downloadFigure(paperId, assetId));
  }

  @GetMapping("/papers/{paperId}")
  @Operation(summary = "Get one published paper")
  @ApiResponse(responseCode = "200", description = "Paper returned")
  @ApiResponse(responseCode = "404", description = "Paper not found")
  public ExamPaperView getPaper(
      @PathVariable UUID paperId, @RequestParam(defaultValue = "false") boolean solutions) {
    return examService.getPaper(paperId, solutions);
  }

  @GetMapping(EXAM)
  @Operation(summary = "Get one owned draft")
  @ApiResponse(responseCode = "200", description = "Draft returned")
  @ApiResponse(responseCode = "403", description = "Staff access required")
  @ApiResponse(responseCode = "404", description = "Draft not found")
  public ExamDraftResponse getDraft(@PathVariable UUID examId) {
    return examService.getDraft(examId);
  }

  @PatchMapping(EXAM)
  @Operation(summary = "Replace an owned draft")
  @ApiResponse(responseCode = "200", description = "Draft updated")
  @ApiResponse(responseCode = "400", description = "Invalid placement")
  @ApiResponse(responseCode = "403", description = "Staff access required")
  @ApiResponse(responseCode = "404", description = "Draft not found")
  @ApiResponse(responseCode = "409", description = "Draft changed concurrently")
  public ExamDraftResponse update(
      @PathVariable UUID examId, @Valid @RequestBody SaveExamDraftRequest request) {
    return examService.update(examId, request);
  }

  @PostMapping(EXAM + "/publish")
  @Operation(summary = "Publish the next immutable version")
  @ApiResponse(responseCode = "200", description = "Frozen staff paper returned")
  @ApiResponse(responseCode = "400", description = "Draft is not publishable or expectedVersion is missing")
  @ApiResponse(responseCode = "403", description = "Staff access required")
  @ApiResponse(responseCode = "404", description = "Draft not found")
  @ApiResponse(responseCode = "409", description = "Draft changed concurrently")
  public StaffExamSolutionResponse publish(
      @PathVariable UUID examId, @Valid @RequestBody PublishExamRequest request) {
    return examService.publish(examId, request);
  }

  @GetMapping(EXAM + "/preview")
  @Operation(summary = "Preview an owned draft without publishing it")
  @ApiResponse(responseCode = "200", description = "Staff preview returned")
  @ApiResponse(responseCode = "400", description = "Placement is not publishable")
  @ApiResponse(responseCode = "403", description = "Staff access required")
  @ApiResponse(responseCode = "404", description = "Draft not found")
  public ExamPaperView preview(
      @PathVariable UUID examId, @RequestParam(defaultValue = "false") boolean solutions) {
    return examService.preview(examId, solutions);
  }

  private static ResponseEntity<byte[]> figure(ExamFigureDownload file) {
    var bytes = file.content() == null ? new byte[0] : file.content();
    var name = file.originalName() == null ? "figure" : file.originalName();
    var disposition = ContentDisposition.inline().filename(name, StandardCharsets.UTF_8).build();
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(file.contentType()))
        .contentLength(bytes.length)
        .cacheControl(CacheControl.noStore())
        .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
        .header("X-Content-Type-Options", "nosniff")
        .body(bytes);
  }
}
