package me.nghlong3004.olympic.api.learning.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.api.learning.dto.CreateTopicRequest;
import me.nghlong3004.olympic.api.learning.dto.TopicResponse;
import me.nghlong3004.olympic.api.learning.dto.UpdateTopicRequest;
import me.nghlong3004.olympic.api.learning.service.TopicService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

/**
 * REST controller for topic management.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@RestController
@RequestMapping("/api/v1/topics")
@Tag(name = "Topics", description = "Topic CRUD operations")
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;

    @Operation(summary = "List topics by subject")
    @ApiResponse(responseCode = "200", description = "Topics listed")
    @GetMapping
    public ResponseEntity<Page<TopicResponse>> listBySubject(
            @RequestParam UUID subjectId,
            Pageable pageable) {
        return ResponseEntity.ok(topicService.findBySubject(subjectId, pageable));
    }

    @Operation(summary = "Get topic by ID")
    @ApiResponse(responseCode = "200", description = "Topic found")
    @GetMapping("/{id}")
    public ResponseEntity<TopicResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(topicService.getByPublicId(id));
    }

    @Operation(summary = "Create a new topic")
    @ApiResponse(responseCode = "201", description = "Topic created")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<TopicResponse> create(@Valid @RequestBody CreateTopicRequest request) {
        TopicResponse response = topicService.create(request);
        URI location = URI.create("/api/v1/topics/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Update a topic")
    @ApiResponse(responseCode = "200", description = "Topic updated")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<TopicResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTopicRequest request) {
        return ResponseEntity.ok(topicService.update(id, request));
    }

    @Operation(summary = "Toggle topic active/inactive")
    @ApiResponse(responseCode = "204", description = "Status toggled")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<Void> toggleActive(@PathVariable UUID id) {
        topicService.toggleActive(id);
        return ResponseEntity.noContent().build();
    }
}
