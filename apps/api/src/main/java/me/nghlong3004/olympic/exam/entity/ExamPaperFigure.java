package me.nghlong3004.olympic.exam.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Copied private raster. Students are not served solution-only bytes.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Entity
@Table(name = "exam_paper_figures")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamPaperFigure {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "paper_id", nullable = false, updatable = false)
  private UUID paperId;

  @Column(name = "asset_id", nullable = false, updatable = false)
  private UUID assetId;

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

  @Column(name = "solution_only", nullable = false, updatable = false)
  private boolean solutionOnly;
}
