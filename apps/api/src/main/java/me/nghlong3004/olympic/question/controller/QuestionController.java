package me.nghlong3004.olympic.question.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import me.nghlong3004.olympic.question.request.UpdateQuestionRequest;
import me.nghlong3004.olympic.question.dto.QuestionFigureDownload;
import me.nghlong3004.olympic.question.response.QuestionFigureResponse;
import me.nghlong3004.olympic.question.response.QuestionPageResponse;
import me.nghlong3004.olympic.question.response.QuestionResponse;
import me.nghlong3004.olympic.question.service.QuestionService;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.multipart.MultipartFile;
import java.nio.charset.StandardCharsets;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@RestController
@RequestMapping("/api/v1/questions")
@RequiredArgsConstructor
@Tag(name = "Questions", description = "Question bank management")
public class QuestionController {
  private final QuestionService questionService;

  @GetMapping
  @Operation(summary = "Search the question bank")
  @ApiResponse(responseCode = "200", description = "Matching questions returned")
  @ApiResponse(responseCode = "403", description = "Staff access required")
  public QuestionPageResponse search(
      @RequestParam(required = false) QuestionStatus status,
      @RequestParam(required = false) UUID subjectId,
      @RequestParam(required = false) UUID topicId,
      @RequestParam(required = false) String search,
      Pageable pageable) {
    return questionService.search(status, subjectId, topicId, search, pageable);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create a schemaVersion 1 draft question")
  @ApiResponse(responseCode = "201", description = "Draft question created")
  @ApiResponse(responseCode = "400", description = "Invalid manual question content")
  @ApiResponse(responseCode = "403", description = "Staff access required")
  public QuestionResponse create(@Valid @RequestBody UpdateQuestionRequest request) {
    return questionService.create(request);
  }

  @GetMapping("/{id}")
  @Operation(summary = "Get a question")
  @ApiResponse(responseCode = "200", description = "Question returned")
  @ApiResponse(responseCode = "404", description = "Question not found")
  public QuestionResponse get(@PathVariable UUID id) {
    return questionService.get(id);
  }

  @PatchMapping("/{id}")
  @Operation(summary = "Update a draft question")
  @ApiResponse(responseCode = "200", description = "Draft question updated")
  @ApiResponse(responseCode = "400", description = "Invalid question content")
  @ApiResponse(responseCode = "404", description = "Question, subject, or topic not found")
  @ApiResponse(responseCode = "409", description = "Question is not a draft or changed concurrently")
  public QuestionResponse update(
      @PathVariable UUID id, @Valid @RequestBody UpdateQuestionRequest request) {
    return questionService.update(id, request);
  }

  @PostMapping("/{id}/duplicate")
  @Operation(summary = "Duplicate a question as a draft")
  @ApiResponse(responseCode = "200", description = "Draft copy created")
  @ApiResponse(responseCode = "404", description = "Question not found")
  public QuestionResponse duplicate(@PathVariable UUID id) {
    return questionService.duplicate(id);
  }

  @PostMapping("/{id}/publish")
  @Operation(summary = "Publish a draft question")
  @ApiResponse(responseCode = "200", description = "Question published")
  @ApiResponse(responseCode = "400", description = "Question is incomplete")
  @ApiResponse(responseCode = "404", description = "Question not found")
  @ApiResponse(responseCode = "409", description = "Question is not a draft or changed concurrently")
  public QuestionResponse publish(@PathVariable UUID id) {
    return questionService.publish(id);
  }

  @PostMapping("/{id}/archive")
  @Operation(summary = "Archive a published question")
  @ApiResponse(responseCode = "200", description = "Question archived")
  @ApiResponse(responseCode = "404", description = "Question not found")
  @ApiResponse(responseCode = "409", description = "Question is not published or changed concurrently")
  public QuestionResponse archive(@PathVariable UUID id) {
    return questionService.archive(id);
  }

  @PostMapping("/{id}/restore")
  @Operation(summary = "Restore an archived question")
  @ApiResponse(responseCode = "200", description = "Question restored")
  @ApiResponse(responseCode = "404", description = "Question not found")
  @ApiResponse(responseCode = "409", description = "Question is not archived or changed concurrently")
  public QuestionResponse restore(@PathVariable UUID id) {
    return questionService.restore(id);
  }

  @PostMapping(value = "/{id}/figures", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Store an immutable figure on an owned draft")
  @ApiResponse(responseCode = "201", description = "Figure stored")
  @ApiResponse(responseCode = "400", description = "Figure type, size, or dimension is invalid")
  @ApiResponse(responseCode = "404", description = "Draft question not found")
  public QuestionFigureResponse uploadFigure(
      @PathVariable UUID id, @RequestPart("file") MultipartFile file) {
    return questionService.uploadFigure(id, file);
  }

  @GetMapping("/{id}/figures/{figureId}")
  @Operation(summary = "Read a private figure for a staff-visible question")
  @ApiResponse(responseCode = "200", description = "Figure bytes")
  @ApiResponse(responseCode = "403", description = "Staff access required")
  @ApiResponse(responseCode = "404", description = "Question or figure not found")
  public ResponseEntity<byte[]> downloadFigure(@PathVariable UUID id, @PathVariable UUID figureId) {
    return figure(questionService.downloadFigure(id, figureId));
  }

  private static ResponseEntity<byte[]> figure(QuestionFigureDownload file) {
    var disposition = ContentDisposition.inline()
        .filename(file.originalName(), StandardCharsets.UTF_8)
        .build();
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(file.contentType()))
        .contentLength(file.content().length)
        .cacheControl(CacheControl.noStore())
        .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
        .header("X-Content-Type-Options", "nosniff")
        .body(file.content());
  }
}
