package me.nghlong3004.olympic.api.learning.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.api.learning.dto.CreateSubjectRequest;
import me.nghlong3004.olympic.api.learning.dto.SubjectResponse;
import me.nghlong3004.olympic.api.learning.dto.UpdateSubjectRequest;
import me.nghlong3004.olympic.api.learning.service.SubjectService;
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
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

/**
 * REST controller for subject management.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@RestController
@RequestMapping("/api/v1/subjects")
@Tag(name = "Subjects", description = "Subject CRUD operations")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @Operation(summary = "List all active subjects")
    @ApiResponse(responseCode = "200", description = "Subjects listed")
    @GetMapping
    public ResponseEntity<Page<SubjectResponse>> listActive(Pageable pageable) {
        return ResponseEntity.ok(subjectService.findAllActive(pageable));
    }

    @Operation(summary = "List all subjects (including inactive)")
    @ApiResponse(responseCode = "200", description = "All subjects listed")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public ResponseEntity<Page<SubjectResponse>> listAll(Pageable pageable) {
        return ResponseEntity.ok(subjectService.findAll(pageable));
    }

    @Operation(summary = "Get subject by ID")
    @ApiResponse(responseCode = "200", description = "Subject found")
    @GetMapping("/{id}")
    public ResponseEntity<SubjectResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(subjectService.getByPublicId(id));
    }

    @Operation(summary = "Create a new subject")
    @ApiResponse(responseCode = "201", description = "Subject created")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<SubjectResponse> create(@Valid @RequestBody CreateSubjectRequest request) {
        SubjectResponse response = subjectService.create(request);
        URI location = URI.create("/api/v1/subjects/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Update a subject")
    @ApiResponse(responseCode = "200", description = "Subject updated")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<SubjectResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSubjectRequest request) {
        return ResponseEntity.ok(subjectService.update(id, request));
    }

    @Operation(summary = "Toggle subject active/inactive")
    @ApiResponse(responseCode = "204", description = "Status toggled")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<Void> toggleActive(@PathVariable UUID id) {
        subjectService.toggleActive(id);
        return ResponseEntity.noContent().build();
    }
}
