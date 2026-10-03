package me.nghlong3004.olympic.recognition.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Bounded binary data kept inside PostgreSQL; private evidence has no external storage URL.
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
@Entity
@Table(name = "recognition_files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecognitionFile {
  @Id @GeneratedValue(strategy = GenerationType.UUID) @Column(name = "id", nullable = false, updatable = false) private UUID id;
  @Column(name = "honor_id") private UUID honorId;
  @Column(name = "achievement_id") private UUID achievementId;
  @Column(name = "original_name", nullable = false, length = 200) private String originalName;
  @Column(name = "content_type", nullable = false, length = 100) private String contentType;
  @Column(name = "size", nullable = false) private long size;
  @Column(name = "position", nullable = false) private int position;
  @Column(name = "content", nullable = false, columnDefinition = "bytea") private byte[] content;
}
