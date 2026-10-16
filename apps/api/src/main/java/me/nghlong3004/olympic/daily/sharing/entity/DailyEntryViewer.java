package me.nghlong3004.olympic.daily.sharing.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * One named viewer of one saved Daily entry through one group.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/16/2026
 */
@Entity
@Table(name = "daily_entry_viewers")
@Getter
@NoArgsConstructor
public class DailyEntryViewer {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "plan_id", nullable = false, updatable = false)
  private UUID planId;

  @Column(name = "group_id", nullable = false, updatable = false)
  private UUID groupId;

  @Column(name = "viewer_id", nullable = false, updatable = false)
  private UUID viewerId;

  @Column(name = "shared_at", nullable = false, updatable = false)
  private OffsetDateTime sharedAt;

  public DailyEntryViewer(UUID planId, UUID groupId, UUID viewerId, OffsetDateTime sharedAt) {
    this.planId = planId;
    this.groupId = groupId;
    this.viewerId = viewerId;
    this.sharedAt = sharedAt;
  }
}
