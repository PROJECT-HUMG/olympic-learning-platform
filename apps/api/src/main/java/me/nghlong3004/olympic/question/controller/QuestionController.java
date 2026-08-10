package me.nghlong3004.olympic.question.controller;

import io.swagger.v3.oas.annotations.Operation;
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
import org.springframework.web.bind.annotation.*;

/** @author nghlong3004 (Long Nguyen Hoang) @since 8/10/2026 */
@RestController
@RequestMapping("/api/v1/questions")
@RequiredArgsConstructor
@Tag(name = "Questions", description = "Question bank management")
public class QuestionController {
  private final QuestionService questionService;

  @GetMapping
  @Operation(summary = "Search the question bank")
  public QuestionPageResponse search(@RequestParam(required = false) QuestionStatus status,
      @RequestParam(required = false) UUID subjectId, @RequestParam(required = false) UUID topicId,
      @RequestParam(required = false) String search, Pageable pageable) {
    return questionService.search(status, subjectId, topicId, search, pageable);
  }

  @GetMapping("/{id}") public QuestionResponse get(@PathVariable UUID id) { return questionService.get(id); }
  @PatchMapping("/{id}") public QuestionResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateQuestionRequest request) { return questionService.update(id, request); }
  @PostMapping("/{id}/duplicate") public QuestionResponse duplicate(@PathVariable UUID id) { return questionService.duplicate(id); }
  @PostMapping("/{id}/publish") public QuestionResponse publish(@PathVariable UUID id) { return questionService.publish(id); }
  @PostMapping("/{id}/archive") public QuestionResponse archive(@PathVariable UUID id) { return questionService.archive(id); }
  @PostMapping("/{id}/restore") public QuestionResponse restore(@PathVariable UUID id) { return questionService.restore(id); }
}
