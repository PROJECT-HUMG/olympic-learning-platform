package me.nghlong3004.olympic.studyroom.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
import me.nghlong3004.olympic.user.entity.User;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
@Entity
@Table(name = "study_room_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyRoomMember {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "room_id", nullable = false)
  private StudyRoom room;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "focus_millis", nullable = false)
  private long focusMillis;

  @Column(name = "joined", nullable = false)
  private boolean joined;

  @Column(name = "joined_at", nullable = false)
  private OffsetDateTime joinedAt;

  @Column(name = "last_seen", nullable = false)
  private OffsetDateTime lastSeen;
}
