package me.nghlong3004.olympic.document.service;

import java.util.function.Predicate;

/**
 * Generates URL-friendly slugs for documents.
 *
 * <p>Implementations are responsible for converting arbitrary text into lowercase, SEO-friendly
 * slugs and optionally ensuring uniqueness.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
public interface SlugGenerator {

  /**
   * Generates a slug from the given text.
   *
   * @param text the source text
   * @return generated slug
   */
  String generate(String text);

  /**
   * Generates a unique slug.
   *
   * <p>If the generated slug already exists, a numeric suffix will be appended until a unique slug
   * is found.
   *
   * @param text the source text
   * @param slugExists predicate used to check whether a slug already exists
   * @return a unique slug
   */
  String generateUnique(String text, Predicate<String> slugExists);
}
