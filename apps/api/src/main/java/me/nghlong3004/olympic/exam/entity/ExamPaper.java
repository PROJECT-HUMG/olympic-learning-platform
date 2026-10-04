package me.nghlong3004.olympic.exam.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Immutable published exam version.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Entity
@Table(name = "exam_papers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamPaper {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "exam_id", nullable = false, updatable = false)
  private UUID examId;

  @Column(name = "version_number", nullable = false, updatable = false)
  private int versionNumber;

  @Column(name = "title", nullable = false, length = 300, updatable = false)
  private String title;

  @Column(name = "subject_id", nullable = false, updatable = false)
  private UUID subjectId;

  @Column(name = "instructions", nullable = false, length = 4000, updatable = false)
  private String instructions;

  @Column(name = "release_at", nullable = false, updatable = false)
  private OffsetDateTime releaseAt;

  @Column(name = "published_at", nullable = false, updatable = false)
  private OffsetDateTime publishedAt;

  @Column(name = "total_points", nullable = false, precision = 10, scale = 2, updatable = false)
  private BigDecimal totalPoints;

  @Column(name = "created_by", nullable = false, updatable = false)
  private UUID createdById;
}
