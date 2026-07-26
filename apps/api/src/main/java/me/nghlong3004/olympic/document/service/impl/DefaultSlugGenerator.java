package me.nghlong3004.olympic.document.service.impl;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Objects;
import java.util.function.Predicate;
import me.nghlong3004.olympic.document.service.SlugGenerator;
import org.springframework.stereotype.Service;

/**
 * Default implementation of {@link SlugGenerator}.
 *
 * <p>This implementation:
 *
 * <ul>
 *   <li>Removes accents and diacritical marks.
 *   <li>Converts text to lowercase.
 *   <li>Replaces non-alphanumeric characters with hyphens.
 *   <li>Collapses consecutive hyphens.
 *   <li>Ensures uniqueness by appending a numeric suffix.
 * </ul>
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@Service
public class DefaultSlugGenerator implements SlugGenerator {

  @Override
  public String generate(String text) {
    Objects.requireNonNull(text, "text must not be null");

    String slug =
        Normalizer.normalize(text, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("-{2,}", "-")
            .replaceAll("^-|-$", "");

    return slug.isBlank() ? "document" : slug;
  }

  @Override
  public String generateUnique(String text, Predicate<String> slugExists) {
    Objects.requireNonNull(slugExists, "slugExists must not be null");

    String baseSlug = generate(text);

    if (!slugExists.test(baseSlug)) {
      return baseSlug;
    }

    int suffix = 1;

    while (true) {
      String candidate = baseSlug + "-" + suffix;

      if (!slugExists.test(candidate)) {
        return candidate;
      }

      suffix++;
    }
  }
}
