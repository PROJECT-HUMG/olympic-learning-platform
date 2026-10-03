package me.nghlong3004.olympic.recognition.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Historical name snapshot; linking an account never grants points.
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HonorParticipant {
  @Column(name = "user_id") private UUID userId;
  @Column(name = "full_name", nullable = false, length = 200) private String fullName;
  @Column(name = "award", length = 100) private String award;
}
