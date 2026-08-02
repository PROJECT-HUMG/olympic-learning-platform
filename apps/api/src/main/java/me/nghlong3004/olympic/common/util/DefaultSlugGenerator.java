package me.nghlong3004.olympic.common.util;

import java.text.Normalizer;
import org.springframework.stereotype.Component;

/**
 * Default implementation of {@link SlugGenerator}.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/2/2026
 */
@Component
public class DefaultSlugGenerator implements SlugGenerator {
  @Override
  public String generate(String title) {
    if (title == null) return "content";
    String normalized = Normalizer.normalize(title, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    String slug = normalized.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
    return slug.isBlank() ? "content" : slug.substring(0, Math.min(slug.length(), 180));
  }
}
