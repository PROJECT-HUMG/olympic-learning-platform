package me.nghlong3004.olympic.common.util;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/2/2026
 */
public interface SlugGenerator {
  /**
   * Generates a normalized URL slug from a given title.
   *
   * @param title the title to generate a slug for
   * @return the generated URL-friendly slug
   */
  String generate(String title);
}
