package me.nghlong3004.olympic.recognition.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.nghlong3004.olympic.recognition.enums.HonorScope;
import me.nghlong3004.olympic.recognition.enums.HonorStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
@Entity
@Table(name = "recognition_honors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Honor {
  @Id @GeneratedValue(strategy = GenerationType.UUID) @Column(name = "id", nullable = false, updatable = false) private UUID id;
  @Column(name = "title", nullable = false, length = 200) private String title;
  @Column(name = "subject", nullable = false, length = 100) private String subject;
  @Column(name = "year", nullable = false) private int year;
  @Column(name = "description", length = 10000) private String description;
  @Enumerated(EnumType.STRING) @Column(name = "scope", nullable = false, length = 30) private HonorScope scope;
  @Enumerated(EnumType.STRING) @Column(name = "status", nullable = false, length = 30) private HonorStatus status;
  @ElementCollection
  @CollectionTable(name = "recognition_honor_participants", joinColumns = @JoinColumn(name = "honor_id"))
  @OrderColumn(name = "position")
  @Builder.Default private List<HonorParticipant> participants = new ArrayList<>();
  @Column(name = "created_by", nullable = false) private UUID createdBy;
  @Column(name = "created_at", nullable = false, updatable = false) private OffsetDateTime createdAt;
  @Column(name = "updated_at", nullable = false) private OffsetDateTime updatedAt;
  @Version @Column(name = "version", nullable = false) private long version;
}
