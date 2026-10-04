package me.nghlong3004.olympic.daily.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One personal plan for one platform calendar date. Owner and date are fixed after insert.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Entity
@Table(name = "daily_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyPlan {
  @Id
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "owner_id", nullable = false, updatable = false)
  private UUID ownerId;

  @Column(name = "plan_date", nullable = false, updatable = false)
  private LocalDate planDate;

  @Column(name = "first_submitted_at")
  private OffsetDateTime firstSubmittedAt;

  @Column(name = "review_reasons", length = 4000)
  private String reviewReasons;

  @Column(name = "review_went_well", length = 4000)
  private String reviewWentWell;

  @Column(name = "review_tomorrow", length = 4000)
  private String reviewTomorrow;

  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  @Version
  @Column(name = "version", nullable = false)
  private Long version;

  @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("position ASC")
  @Builder.Default
  private List<DailyTask> tasks = new ArrayList<>();
}
