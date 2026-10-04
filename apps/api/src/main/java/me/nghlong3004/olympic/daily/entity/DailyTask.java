package me.nghlong3004.olympic.daily.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.nghlong3004.olympic.daily.enums.DailyTaskPriority;
import me.nghlong3004.olympic.daily.enums.DailyTaskStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Entity
@Table(name = "daily_tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DailyTask {

  @Id
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "plan_id", nullable = false, updatable = false)
  private DailyPlan plan;

  @Column(name = "position", nullable = false)
  private int position;

  @Column(name = "title", nullable = false, length = 200)
  private String title;

  @Enumerated(EnumType.STRING)
  @Column(name = "priority", nullable = false, length = 16)
  private DailyTaskPriority priority;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 16)
  private DailyTaskStatus status;
}
