package me.nghlong3004.olympic.daily.evidence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.nghlong3004.olympic.daily.entity.DailyTask;
import me.nghlong3004.olympic.daily.evidence.enums.EvidenceKind;
import me.nghlong3004.olympic.daily.evidence.enums.EvidenceStage;

/**
 * Immutable evidence payload; deletion is the only supported change.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Entity
@Table(name = "daily_evidence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyEvidence {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "task_id", nullable = false, updatable = false)
  private DailyTask task;

  @Enumerated(EnumType.STRING)
  @Column(name = "stage", nullable = false, updatable = false, length = 16)
  private EvidenceStage stage;

  @Enumerated(EnumType.STRING)
  @Column(name = "kind", nullable = false, updatable = false, length = 16)
  private EvidenceKind kind;

  @Column(name = "original_name", updatable = false, length = 255)
  private String originalName;

  @Column(name = "content_type", updatable = false, length = 255)
  private String contentType;

  @Column(name = "size_bytes", updatable = false)
  private Long sizeBytes;

  @Column(name = "content", updatable = false, columnDefinition = "bytea")
  private byte[] content;

  @Column(name = "url", updatable = false, length = 2048)
  private String url;

  @Column(name = "label", updatable = false, length = 200)
  private String label;

  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;
}
