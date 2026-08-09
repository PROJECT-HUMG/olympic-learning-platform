package me.nghlong3004.olympic.assessment.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportPhase;
import me.nghlong3004.olympic.assessment.enums.AssessmentImportStatus;
import me.nghlong3004.olympic.storage.entity.File;
import me.nghlong3004.olympic.user.entity.User;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Entity
@Table(name = "assessment_imports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentImport {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "source_file_id", nullable = false)
  private File sourceFile;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "created_by", nullable = false)
  private User createdBy;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 40)
  @Builder.Default
  private AssessmentImportStatus status = AssessmentImportStatus.QUEUED;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 40)
  @Builder.Default
  private AssessmentImportPhase phase = AssessmentImportPhase.QUEUED;

  @Column(nullable = false)
  @Builder.Default
  private int progress = 0;

  @Column(name = "total_pages", nullable = false)
  @Builder.Default
  private int totalPages = 0;

  @Column(name = "processed_pages", nullable = false)
  @Builder.Default
  private int processedPages = 0;

  @Column(name = "draft_count", nullable = false)
  @Builder.Default
  private int draftCount = 0;

  @Column(name = "warning_count", nullable = false)
  @Builder.Default
  private int warningCount = 0;

  @Column(name = "attempt_count", nullable = false)
  @Builder.Default
  private int attemptCount = 0;

  @Column(name = "last_error", columnDefinition = "text")
  private String lastError;

  @Column(name = "lease_until")
  private OffsetDateTime leaseUntil;

  @Column(name = "created_at", nullable = false, updatable = false)
  @Builder.Default
  private OffsetDateTime createdAt = OffsetDateTime.now();

  @Column(name = "updated_at", nullable = false)
  @Builder.Default
  private OffsetDateTime updatedAt = OffsetDateTime.now();

  @PreUpdate
  void preUpdate() {
    updatedAt = OffsetDateTime.now();
  }
}
