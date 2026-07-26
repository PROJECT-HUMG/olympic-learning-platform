package me.nghlong3004.olympic.document.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.document.request.CreateDocumentRequest;
import me.nghlong3004.olympic.document.request.DocumentSearchRequest;
import me.nghlong3004.olympic.document.request.UpdateDocumentRequest;
import me.nghlong3004.olympic.document.response.DocumentResponse;
import me.nghlong3004.olympic.document.service.DocumentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@Tag(name = "Document", description = "Document management APIs")
public class DocumentController {

  private final DocumentService documentService;

  @PostMapping
  @Operation(summary = "Create a new document")
  @ResponseStatus(HttpStatus.CREATED)
  public DocumentResponse create(@Valid @RequestBody CreateDocumentRequest request) {
    return documentService.create(request);
  }

  @PutMapping("/{id}")
  @Operation(summary = "Update an existing document")
  public DocumentResponse update(
      @PathVariable UUID id, @Valid @RequestBody UpdateDocumentRequest request) {
    return documentService.update(id, request);
  }

  @GetMapping("/{slug}")
  @Operation(summary = "Get document details by slug")
  public DocumentResponse getBySlug(@PathVariable String slug) {
    return documentService.getBySlug(slug);
  }

  @GetMapping
  @Operation(summary = "Search and filter documents")
  public Page<DocumentResponse> search(
      @Valid @ModelAttribute DocumentSearchRequest request, Pageable pageable) {
    return documentService.search(request, pageable);
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "Soft delete a document")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID id) {
    documentService.delete(id);
  }

  @GetMapping("/{slug}/download")
  @Operation(summary = "Get a pre-signed download URI for the document")
  public ResponseEntity<Void> getDownloadUri(@PathVariable String slug) {
    URI uri = documentService.getDownloadUriBySlug(slug);
    return ResponseEntity.status(HttpStatus.FOUND).location(uri).build();
  }

  @DeleteMapping("/bulk")
  @Operation(summary = "Bulk delete documents (Admin only)")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void bulkDelete(@RequestBody List<UUID> ids) {
    documentService.bulkDelete(ids);
  }

  @DeleteMapping("/users/{userId}")
  @Operation(summary = "Delete all documents by user ID (Admin only)")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteByUserId(@PathVariable UUID userId) {
    documentService.deleteByUserId(userId);
  }

  @PostMapping("/{slug}/view")
  @Operation(summary = "Increment document view count")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void incrementViewCount(@PathVariable String slug) {
    documentService.incrementViewCountBySlug(slug);
  }
}
