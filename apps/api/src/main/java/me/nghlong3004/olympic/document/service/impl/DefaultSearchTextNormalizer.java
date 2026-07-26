package me.nghlong3004.olympic.document.service.impl;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Locale;
import java.util.Objects;
import java.util.regex.Pattern;
import me.nghlong3004.olympic.document.service.SearchTextNormalizer;
import org.springframework.stereotype.Service;

/**
 * Default implementation of {@link SearchTextNormalizer}.
 *
 * <p>This implementation:
 *
 * <ul>
 *   <li>Ignores null or blank values.
 *   <li>Concatenates all text fragments.
 *   <li>Removes Vietnamese accents and other diacritical marks.
 *   <li>Converts text to lowercase.
 *   <li>Normalizes punctuation and whitespace.
 * </ul>
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@Service
public class DefaultSearchTextNormalizer implements SearchTextNormalizer {

  private static final Pattern DIACRITICAL_MARKS = Pattern.compile("\\p{M}+");

  private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-z0-9\\s]");

  private static final Pattern MULTIPLE_WHITESPACE = Pattern.compile("\\s+");

  @Override
  public String normalize(String... values) {
    Objects.requireNonNull(values, "values must not be null");

    String combined =
        Arrays.stream(values)
            .filter(Objects::nonNull)
            .map(String::trim)
            .filter(value -> !value.isBlank())
            .reduce((left, right) -> left + " " + right)
            .orElse("");

    if (combined.isBlank()) {
      return "";
    }

    String normalized = Normalizer.normalize(combined, Normalizer.Form.NFD);

    normalized = DIACRITICAL_MARKS.matcher(normalized).replaceAll("");

    normalized = normalized.replace('đ', 'd').replace('Đ', 'D').toLowerCase(Locale.ROOT);

    normalized = NON_ALPHANUMERIC.matcher(normalized).replaceAll(" ");

    normalized = MULTIPLE_WHITESPACE.matcher(normalized).replaceAll(" ").trim();

    return normalized;
  }
}
