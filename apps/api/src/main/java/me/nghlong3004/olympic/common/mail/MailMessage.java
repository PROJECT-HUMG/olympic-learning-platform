package me.nghlong3004.olympic.common.mail;

import java.util.List;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
public record MailMessage(String to, String subject, String body, boolean html,
    String plainTextBody, List<MailInlineResource> inlineResources) {
  public MailMessage {
    inlineResources = inlineResources == null ? List.of() : List.copyOf(inlineResources);
  }

  public MailMessage(String to, String subject, String body, boolean html) {
    this(to, subject, body, html, null, List.of());
  }
}
