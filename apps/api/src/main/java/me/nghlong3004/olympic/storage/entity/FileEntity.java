package me.nghlong3004.olympic.storage.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;

/**
 * Persisted metadata for a single file managed by the storage subsystem. The actual binary payload
 * lives on the external provider (Cloudinary, S3, …); this entity only tracks the key needed to
 * locate and serve the file.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
@Entity
@Getter
@Setter
@Builder
@Table(name = "files")
@NoArgsConstructor
@AllArgsConstructor
public class FileEntity {

  @Id
  @Column(nullable = false, updatable = false)
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "storage_key", nullable = false, length = 512)
  private String storageKey;

  @Column(name = "original_name", nullable = false)
  private String originalName;

  @Column(name = "content_type", nullable = false, length = 100)
  private String contentType;

  @Column(nullable = false)
  private Long size;

  @Column(nullable = false, length = 50)
  private String provider;

  @Column(nullable = false, length = 50)
  private String folder;

  @Column(name = "created_at", nullable = false, updatable = false)
  @Builder.Default
  private OffsetDateTime createdAt = OffsetDateTime.now();
}
