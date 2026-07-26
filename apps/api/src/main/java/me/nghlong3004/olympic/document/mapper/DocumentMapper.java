package me.nghlong3004.olympic.document.mapper;

import me.nghlong3004.olympic.document.entity.Document;
import me.nghlong3004.olympic.document.response.DocumentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

/**
 * Maps between {@link Document} entities and document response DTOs.
 *
 * <p>This mapper is intentionally kept free of business logic. Computed values such as thumbnail
 * URLs, download URLs or permission-related fields should be populated by the service layer after
 * mapping.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface DocumentMapper {

  /**
   * Converts a document entity into its API response representation.
   *
   * @param document the document entity
   * @return the mapped response DTO
   */
  DocumentResponse toResponse(Document document);
}
