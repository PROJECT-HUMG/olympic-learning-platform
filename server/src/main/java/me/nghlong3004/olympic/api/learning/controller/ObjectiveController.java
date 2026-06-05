package me.nghlong3004.olympic.api.learning.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.api.learning.dto.CreateObjectiveRequest;
import me.nghlong3004.olympic.api.learning.dto.ObjectiveResponse;
import me.nghlong3004.olympic.api.learning.dto.UpdateObjectiveRequest;
import me.nghlong3004.olympic.api.learning.service.ObjectiveService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for learning objective management.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@RestController
@RequestMapping("/api/v1/objectives")
@Tag(name = "Learning Objectives", description = "Learning objective CRUD operations")
@RequiredArgsConstructor
public class ObjectiveController {

    private final ObjectiveService objectiveService;

    @Operation(summary = "List objectives by topic")
    @ApiResponse(responseCode = "200", description = "Objectives listed")
    @GetMapping
    public ResponseEntity<List<ObjectiveResponse>> listByTopic(@RequestParam UUID topicId) {
        return ResponseEntity.ok(objectiveService.findByTopic(topicId));
    }

    @Operation(summary = "Get objective by ID")
    @ApiResponse(responseCode = "200", description = "Objective found")
    @GetMapping("/{id}")
    public ResponseEntity<ObjectiveResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(objectiveService.getByPublicId(id));
    }

    @Operation(summary = "Create a new learning objective")
    @ApiResponse(responseCode = "201", description = "Objective created")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ObjectiveResponse> create(@Valid @RequestBody CreateObjectiveRequest request) {
        ObjectiveResponse response = objectiveService.create(request);
        URI location = URI.create("/api/v1/objectives/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Update a learning objective")
    @ApiResponse(responseCode = "200", description = "Objective updated")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ObjectiveResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateObjectiveRequest request) {
        return ResponseEntity.ok(objectiveService.update(id, request));
    }

    @Operation(summary = "Delete a learning objective")
    @ApiResponse(responseCode = "204", description = "Objective deleted")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        objectiveService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
