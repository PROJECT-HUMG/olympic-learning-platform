package me.nghlong3004.olympic.recognition.entity;

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
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

/**
 * A committed score change, independent of mutable review/visibility metadata.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/16/2026
 */
@Entity
@Table(name = "recognition_score_events")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecognitionScoreEvent {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false, updatable = false)
  private UUID userId;

  @Column(name = "achievement_id", nullable = false, updatable = false)
  private UUID achievementId;

  @Column(name = "achieved_year", nullable = false, updatable = false)
  private int achievedYear;

  @Column(name = "points_delta", nullable = false, updatable = false)
  private int pointsDelta;

  @Generated(event = EventType.INSERT)
  @Column(name = "recorded_at", nullable = false, insertable = false, updatable = false)
  private OffsetDateTime recordedAt;
}
