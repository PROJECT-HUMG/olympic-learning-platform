package me.nghlong3004.olympic.storage.enums;

/**
 * Identifies the external storage backend where a file is physically stored. Persisted alongside
 * each {@link me.nghlong3004.olympic.storage.entity.FileEntity} to enable provider-aware migration
 * and URL resolution at runtime.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
public enum StorageProvider {
  CLOUDINARY,
  S3,
  MINIO,
  LOCAL
}
