package me.nghlong3004.olympic.question.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Immutable raster owned by one manual question. Rows are insert-only; bytes never go to Cloudinary.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Entity
@Table(name = "question_figures")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionFigure {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "question_id", nullable = false, updatable = false)
  private UUID questionId;

  @Column(name = "original_name", nullable = false, updatable = false, length = 200)
  private String originalName;

  @Column(name = "content_type", nullable = false, updatable = false, length = 100)
  private String contentType;

  @Column(name = "size", nullable = false, updatable = false)
  private long size;

  @Column(name = "content", nullable = false, updatable = false, columnDefinition = "bytea")
  private byte[] content;

  @Column(name = "created_at", nullable = false, updatable = false)
  @Builder.Default
  private OffsetDateTime createdAt = OffsetDateTime.now();
}
