package me.nghlong3004.olympic.document.service;

import java.net.URI;
import java.util.UUID;
import java.util.List;
import me.nghlong3004.olympic.document.request.CreateDocumentRequest;
import me.nghlong3004.olympic.document.request.DocumentSearchRequest;
import me.nghlong3004.olympic.document.request.UpdateDocumentRequest;
import me.nghlong3004.olympic.document.response.DocumentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Provides business operations for managing learning documents.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
public interface DocumentService {

  /**
   * Creates a new document.
   *
   * @param request the document creation request
   * @return the created document
   */
  DocumentResponse create(CreateDocumentRequest request);

  /**
   * Updates an existing document.
   *
   * @param id the document identifier
   * @param request the update request
   * @return the updated document
   */
  DocumentResponse update(UUID id, UpdateDocumentRequest request);

  /**
   * Retrieves a document by its slug.
   *
   * @param slug the document slug
   * @return the document
   */
  DocumentResponse getBySlug(String slug);

  /**
   * Searches documents using the given criteria.
   *
   * @param request search criteria
   * @param pageable pagination information
   * @return a page of matching documents
   */
  Page<DocumentResponse> search(DocumentSearchRequest request, Pageable pageable);

  /**
   * Soft deletes a document.
   *
   * @param id the document identifier
   */
  void delete(UUID id);

  /**
   * Resolves the download URI of a document by its slug.
   *
   * <p>The implementation should also increase the download counter.
   *
   * @param slug the document slug
   * @return the download URI
   */
  URI getDownloadUriBySlug(String slug);

  /**
   * Bulk deletes documents by their identifiers.
   *
   * @param ids the list of document identifiers to soft delete
   */
  void bulkDelete(List<UUID> ids);

  /**
   * Deletes all documents created by a specific user.
   *
   * @param userId the user identifier
   */
  void deleteByUserId(UUID userId);

  /**
   * Increments the view count of a document by its slug.
   *
   * @param slug the document slug
   */
  void incrementViewCountBySlug(String slug);
}
