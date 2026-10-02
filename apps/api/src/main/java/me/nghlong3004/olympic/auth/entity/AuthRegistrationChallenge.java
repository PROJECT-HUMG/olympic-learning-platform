package me.nghlong3004.olympic.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@Entity
@Table(name = "auth_registration_challenges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthRegistrationChallenge {
  @Id @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;
  @Column(name = "user_id", nullable = false, unique = true)
  private UUID userId;
  @Column(name = "session_hash", nullable = false, unique = true, length = 64)
  private String sessionHash;
  @Column(name = "code_hash", nullable = false, length = 64)
  private String codeHash;
  @Column(name = "email", nullable = false, length = 100)
  private String email;
  @Column(name = "expires_at", nullable = false)
  private OffsetDateTime expiresAt;
  @Column(name = "session_expires_at", nullable = false)
  private OffsetDateTime sessionExpiresAt;
  @Column(name = "resend_available_at", nullable = false)
  private OffsetDateTime resendAvailableAt;
  @Column(name = "failed_attempts", nullable = false)
  private int failedAttempts;
  @Column(name = "verified_at")
  private OffsetDateTime verifiedAt;
}
