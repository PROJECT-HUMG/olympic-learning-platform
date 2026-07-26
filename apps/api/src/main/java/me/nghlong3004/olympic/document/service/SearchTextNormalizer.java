package me.nghlong3004.olympic.document.service;

/**
 * Normalizes document content for full-text searching.
 *
 * <p>Implementations should convert multiple text fragments into a single, normalized string
 * suitable for keyword searching.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
public interface SearchTextNormalizer {

  /**
   * Normalizes the given text fragments into a searchable string.
   *
   * <p>Null or blank values are ignored.
   *
   * @param values text fragments
   * @return normalized search text
   */
  String normalize(String... values);
}
