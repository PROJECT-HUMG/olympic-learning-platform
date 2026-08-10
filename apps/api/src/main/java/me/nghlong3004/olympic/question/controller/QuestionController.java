package me.nghlong3004.olympic.question.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import me.nghlong3004.olympic.question.request.UpdateQuestionRequest;
import me.nghlong3004.olympic.question.response.QuestionPageResponse;
import me.nghlong3004.olympic.question.response.QuestionResponse;
import me.nghlong3004.olympic.question.service.QuestionService;
import org.springframework.data.domain.Pageable;
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
  @ApiResponse(responseCode = "400", description = "Invalid request or non-draft question")
  @ApiResponse(responseCode = "404", description = "Question, subject, or topic not found")
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
  @ApiResponse(responseCode = "400", description = "Question is incomplete or not a draft")
  @ApiResponse(responseCode = "404", description = "Question not found")
  public QuestionResponse publish(@PathVariable UUID id) {
    return questionService.publish(id);
  }

  @PostMapping("/{id}/archive")
  @Operation(summary = "Archive a published question")
  @ApiResponse(responseCode = "200", description = "Question archived")
  @ApiResponse(responseCode = "400", description = "Question is not published")
  @ApiResponse(responseCode = "404", description = "Question not found")
  public QuestionResponse archive(@PathVariable UUID id) {
    return questionService.archive(id);
  }

  @PostMapping("/{id}/restore")
  @Operation(summary = "Restore an archived question")
  @ApiResponse(responseCode = "200", description = "Question restored")
  @ApiResponse(responseCode = "400", description = "Question is not archived")
  @ApiResponse(responseCode = "404", description = "Question not found")
  public QuestionResponse restore(@PathVariable UUID id) {
    return questionService.restore(id);
  }
}
