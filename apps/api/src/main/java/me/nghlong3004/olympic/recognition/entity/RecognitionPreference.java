package me.nghlong3004.olympic.recognition.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
@Entity
@Table(name = "recognition_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecognitionPreference {
  @Id @Column(name = "user_id", nullable = false) private UUID userId;
  @Column(name = "ranking_opt_in", nullable = false) private boolean rankingOptIn;
}
