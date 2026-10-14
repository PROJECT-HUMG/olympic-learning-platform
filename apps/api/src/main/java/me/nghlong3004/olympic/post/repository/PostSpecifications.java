package me.nghlong3004.olympic.post.repository;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.post.entity.Post;
import me.nghlong3004.olympic.post.enums.PostStatus;
import me.nghlong3004.olympic.post.request.PostSearchRequest;
import org.springframework.data.jpa.domain.Specification;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/09/2026
 */
public final class PostSpecifications {

  private PostSpecifications() {}

  /** Published release eligibility; expiry deliberately remains a separate list-only rule. */
  public static boolean isPubliclyReleased(Post post, OffsetDateTime now) {
    return post.getDeletedAt() == null
        && post.getStatus() == PostStatus.PUBLISHED
        && (post.getPublishedAt() == null || !post.getPublishedAt().isAfter(now));
  }

  public static Specification<Post> publicPosts(PostSearchRequest request, OffsetDateTime now) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = basePredicates(root, criteriaBuilder);
      predicates.add(criteriaBuilder.equal(root.get("status"), PostStatus.PUBLISHED));
      predicates.add(
          criteriaBuilder.or(
              criteriaBuilder.isNull(root.get("publishedAt")),
              criteriaBuilder.lessThanOrEqualTo(root.get("publishedAt"), now)));
      predicates.add(
          criteriaBuilder.or(
              criteriaBuilder.isNull(root.get("expiredAt")),
              criteriaBuilder.greaterThan(root.get("expiredAt"), now)));
      addOptionalFilters(predicates, root, criteriaBuilder, request, null);
      return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
    };
  }

  public static Specification<Post> managementPosts(
      PostSearchRequest request, UUID authorId, OffsetDateTime now) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = basePredicates(root, criteriaBuilder);
      if (authorId != null) {
        predicates.add(criteriaBuilder.equal(root.get("author").get("id"), authorId));
      }
      addOptionalFilters(predicates, root, criteriaBuilder, request, now);
      return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
    };
  }

  public static Specification<Post> status(PostStatus status, UUID authorId, OffsetDateTime now) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = basePredicates(root, criteriaBuilder);
      if (authorId != null) {
        predicates.add(criteriaBuilder.equal(root.get("author").get("id"), authorId));
      }
      predicates.add(criteriaBuilder.equal(root.get("status"), status));
      if (status == PostStatus.PUBLISHED) {
        predicates.add(
            criteriaBuilder.or(
                criteriaBuilder.isNull(root.get("publishedAt")),
                criteriaBuilder.lessThanOrEqualTo(root.get("publishedAt"), now)));
      }
      return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
    };
  }

  public static Specification<Post> expired(UUID authorId, OffsetDateTime now) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = basePredicates(root, criteriaBuilder);
      if (authorId != null) {
        predicates.add(criteriaBuilder.equal(root.get("author").get("id"), authorId));
      }
      predicates.add(criteriaBuilder.equal(root.get("status"), PostStatus.PUBLISHED));
      predicates.add(criteriaBuilder.isNotNull(root.get("expiredAt")));
      predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("expiredAt"), now));
      return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
    };
  }

  private static List<Predicate> basePredicates(Root<Post> root, CriteriaBuilder criteriaBuilder) {
    List<Predicate> predicates = new ArrayList<>();
    predicates.add(criteriaBuilder.isNull(root.get("deletedAt")));
    return predicates;
  }

  private static void addOptionalFilters(
      List<Predicate> predicates,
      Root<Post> root,
      CriteriaBuilder criteriaBuilder,
      PostSearchRequest request,
      OffsetDateTime now) {
    if (request == null) {
      return;
    }
    if (request.type() != null) {
      predicates.add(criteriaBuilder.equal(root.get("type"), request.type()));
    }
    if (request.status() != null) {
      predicates.add(criteriaBuilder.equal(root.get("status"), request.status()));
    }
    if (request.pinned() != null) {
      predicates.add(criteriaBuilder.equal(root.get("pinned"), request.pinned()));
    }
    if (request.keyword() != null && !request.keyword().isBlank()) {
      String pattern = "%" + request.keyword().trim().toLowerCase() + "%";
      predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern));
    }
    if (now != null && request.expired() != null) {
      if (request.expired()) {
        predicates.add(
            criteriaBuilder.and(
                criteriaBuilder.isNotNull(root.get("expiredAt")),
                criteriaBuilder.lessThanOrEqualTo(root.get("expiredAt"), now)));
      } else {
        predicates.add(
            criteriaBuilder.or(
                criteriaBuilder.isNull(root.get("expiredAt")),
                criteriaBuilder.greaterThan(root.get("expiredAt"), now)));
      }
    }
  }
}
