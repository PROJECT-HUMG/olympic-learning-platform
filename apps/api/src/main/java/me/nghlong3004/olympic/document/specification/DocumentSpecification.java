package me.nghlong3004.olympic.document.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import java.util.ArrayList;
import java.util.List;
import me.nghlong3004.olympic.document.entity.Document;
import me.nghlong3004.olympic.document.entity.Tag;
import me.nghlong3004.olympic.document.request.DocumentSearchRequest;
import org.springframework.data.jpa.domain.Specification;

/**
 * Factory for building {@link Specification}s used to search documents.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
public final class DocumentSpecification {

  private DocumentSpecification() {}

  /**
   * Creates a specification from the given search request.
   *
   * @param request search request
   * @return specification
   */
  public static Specification<Document> from(DocumentSearchRequest request) {
    return (root, query, criteriaBuilder) -> {
      List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

      // Soft delete
      predicates.add(criteriaBuilder.isNull(root.get("deletedAt")));

      // Keyword
      if (request.keyword() != null && !request.keyword().isBlank()) {

        predicates.add(
            criteriaBuilder.like(
                root.get("searchText"), "%" + request.keyword().trim().toLowerCase() + "%"));
      }

      // Category
      if (request.categoryId() != null) {
        predicates.add(criteriaBuilder.equal(root.get("category").get("id"), request.categoryId()));
      }

      // Subject
      if (request.subjectId() != null) {
        predicates.add(criteriaBuilder.equal(root.get("subject").get("id"), request.subjectId()));
      }

      // Tags
      if (request.tagIds() != null && !request.tagIds().isEmpty()) {

        Join<Document, Tag> tagJoin = root.join("tags", JoinType.INNER);

        predicates.add(tagJoin.get("id").in(request.tagIds()));

        query.distinct(true);
      }

      return criteriaBuilder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
    };
  }
}
