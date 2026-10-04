package me.nghlong3004.olympic.daily.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Owner reflection for one Monday–Sunday platform week. It does not copy plans into a group.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Entity
@Table(name = "daily_weekly_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DailyWeeklyReview {

  @Id
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "owner_id", nullable = false, updatable = false)
  private UUID ownerId;

  @Column(name = "week_start", nullable = false, updatable = false)
  private LocalDate weekStart;

  @Column(name = "recurring_unfinished", length = 4000)
  private String recurringUnfinished;

  @Column(name = "issues", length = 4000)
  private String issues;

  @Column(name = "reflection", length = 4000)
  private String reflection;

  @Column(name = "next_week_changes", length = 4000)
  private String nextWeekChanges;

  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  @Version
  @Column(name = "version", nullable = false)
  private Long version;
}
