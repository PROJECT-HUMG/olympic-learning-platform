package me.nghlong3004.olympic.topic.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.topic.request.CreateTopicRequest;
import me.nghlong3004.olympic.topic.response.TopicResponse;
import me.nghlong3004.olympic.topic.service.TopicService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@RestController
@RequestMapping("/api/v1/topics")
@RequiredArgsConstructor
@Tag(name = "Topics", description = "Learning topic management")
public class TopicController {
  private final TopicService topicService;

  @GetMapping
  @Operation(summary = "List enabled topics for a subject")
  @ApiResponse(responseCode = "200", description = "Enabled topics returned")
  public List<TopicResponse> getBySubject(@RequestParam UUID subjectId) {
    return topicService.getEnabledBySubject(subjectId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create a topic")
  @ApiResponse(responseCode = "201", description = "Topic created")
  @ApiResponse(responseCode = "400", description = "Validation failed")
  @ApiResponse(responseCode = "403", description = "Administrator access required")
  @ApiResponse(responseCode = "404", description = "Subject not found")
  public TopicResponse create(@Valid @RequestBody CreateTopicRequest request) {
    return topicService.create(request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Disable a topic")
  @ApiResponse(responseCode = "204", description = "Topic disabled")
  @ApiResponse(responseCode = "403", description = "Administrator access required")
  @ApiResponse(responseCode = "404", description = "Topic not found")
  public void disable(@PathVariable UUID id) {
    topicService.disable(id);
  }
}
