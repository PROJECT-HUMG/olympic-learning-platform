package me.nghlong3004.olympic.storage.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Logical folder categories that map to physical folder paths on cloud storage. Every uploaded file
 * is placed into exactly one folder, keeping the bucket well-organised and making per-category
 * lifecycle rules (CDN caching, retention) straightforward.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
@Getter
@RequiredArgsConstructor
public enum StorageFolder {
  AVATAR("avatars"),
  DOCUMENT("documents"),
  QUESTION("questions"),
  SUBMISSION("submissions"),
  POST("posts");

  private final String path;
}
