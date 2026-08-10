package me.nghlong3004.olympic.topic.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.topic.response.TopicResponse;
import me.nghlong3004.olympic.topic.service.TopicService;
import me.nghlong3004.olympic.topic.request.CreateTopicRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/** @author nghlong3004 (Long Nguyen Hoang) @since 8/10/2026 */
@RestController
@RequestMapping("/api/v1/topics")
@RequiredArgsConstructor
@Tag(name = "Topics")
public class TopicController {
  private final TopicService topicService;

  @GetMapping
  @Operation(summary = "List enabled topics for a subject")
  public List<TopicResponse> getBySubject(@RequestParam UUID subjectId) {
    return topicService.getEnabledBySubject(subjectId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public TopicResponse create(@Valid @RequestBody CreateTopicRequest request) { return topicService.create(request); }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void disable(@PathVariable UUID id) { topicService.disable(id); }
}
