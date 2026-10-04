package me.nghlong3004.olympic.daily.feedback.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Entity
@Table(name = "daily_feedback")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyFeedback {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false)
  private UUID id;

  @Column(name = "group_id", nullable = false)
  private UUID groupId;

  @Column(name = "owner_id", nullable = false)
  private UUID ownerId;

  @Column(name = "plan_id")
  private UUID planId;

  @Column(name = "weekly_review_id")
  private UUID weeklyReviewId;

  @Column(name = "author_id", nullable = false)
  private UUID authorId;

  @Column(name = "text", nullable = false, length = 4000)
  private String text;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  @Version
  @Column(name = "version", nullable = false)
  private Long version;
}
