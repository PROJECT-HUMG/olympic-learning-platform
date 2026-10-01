package me.nghlong3004.olympic.studyroom.entity;

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
import me.nghlong3004.olympic.studyroom.enums.StudyRoomRequestPolicy;
import me.nghlong3004.olympic.user.entity.User;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
@Entity
@Table(name = "study_rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyRoom {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "owner_id", nullable = false)
  private User owner;

  @Column(name = "name", nullable = false, length = 80)
  private String name;

  @Column(name = "focus_minutes", nullable = false)
  private int focusMinutes;

  @Column(name = "break_minutes", nullable = false)
  private int breakMinutes;

  @Column(name = "long_break_minutes", nullable = false)
  private int longBreakMinutes;

  @Enumerated(EnumType.STRING)
  @Column(name = "request_policy", nullable = false, length = 30)
  private StudyRoomRequestPolicy requestPolicy;

  @Column(name = "minimum_study_minutes", nullable = false)
  private int minimumStudyMinutes;

  @Column(name = "closed", nullable = false)
  private boolean closed;

  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @Column(name = "closed_at")
  private OffsetDateTime closedAt;

  @Column(name = "playback_video_id", nullable = false, length = 11)
  private String playbackVideoId;

  @Column(name = "playback_title", nullable = false, length = 120)
  private String playbackTitle;

  @Column(name = "playback_started_at", nullable = false)
  private OffsetDateTime playbackStartedAt;

  @Column(name = "playback_version", nullable = false)
  private long playbackVersion;

  @Column(name = "playback_default", nullable = false)
  private boolean playbackDefault;
}
