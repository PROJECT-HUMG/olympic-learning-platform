package me.nghlong3004.olympic.recognition.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.nghlong3004.olympic.recognition.enums.AchievementAward;
import me.nghlong3004.olympic.recognition.enums.AchievementCategory;
import me.nghlong3004.olympic.recognition.enums.AchievementStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
@Entity
@Table(name = "recognition_achievements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Achievement {
  @Id @GeneratedValue(strategy = GenerationType.UUID) @Column(name = "id", nullable = false, updatable = false) private UUID id;
  @Column(name = "user_id", nullable = false) private UUID userId;
  @Column(name = "title", nullable = false, length = 200) private String title;
  @Column(name = "description", length = 10000) private String description;
  @Enumerated(EnumType.STRING) @Column(name = "category", nullable = false, length = 30) private AchievementCategory category;
  @Enumerated(EnumType.STRING) @Column(name = "award", nullable = false, length = 30) private AchievementAward award;
  @Column(name = "include_participation", nullable = false) private boolean includeParticipation;
  @Column(name = "achieved_date", nullable = false) private LocalDate achievedDate;
  @Column(name = "public_visible", nullable = false) private boolean publicVisible;
  @Enumerated(EnumType.STRING) @Column(name = "status", nullable = false, length = 30) private AchievementStatus status;
  @Column(name = "award_points", nullable = false) private int awardPoints;
  @Column(name = "participation_points", nullable = false) private int participationPoints;
  @Column(name = "submitted_by", nullable = false) private UUID submittedBy;
  @Column(name = "reviewed_by") private UUID reviewedBy;
  @Column(name = "review_note", length = 2000) private String reviewNote;
  @Column(name = "reviewed_at") private OffsetDateTime reviewedAt;
  @Column(name = "created_at", nullable = false, updatable = false) private OffsetDateTime createdAt;
  @Column(name = "updated_at", nullable = false) private OffsetDateTime updatedAt;
  @Version @Column(name = "version", nullable = false) private long version;
}
