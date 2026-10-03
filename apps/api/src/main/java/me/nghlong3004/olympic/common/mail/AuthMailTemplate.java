package me.nghlong3004.olympic.common.mail;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@Component
public class AuthMailTemplate {
  private static final String TEMPLATE = loadTemplate();
  private static final Pattern PLACEHOLDER = Pattern.compile("\\{\\{([a-z]+)}}");
  private static final List<MailInlineResource> LOGO = List.of(
      new MailInlineResource("olympic-logo", "mail/olympic-logo.png", "image/png"));

  public MailMessage otp(String recipient, String displayName, String code) {
    var greeting = greeting(displayName);
    var intro = "Nhập mã bên dưới trên màn hình đăng ký để xác thực email của bạn.";
    var disclaimer = "Không chia sẻ mã với bất kỳ ai. Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.";
    var action = """
        <table class="email-code" role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" bgcolor="#eaf2f9"
          style="width:100%%;background-color:#eaf2f9;border-radius:12px;">
        <tr><td align="center" style="padding:22px 12px;">
        <p class="email-text" style="margin:0;color:#0b3150;font-family:'Courier New',monospace;font-size:36px;line-height:44px;font-weight:700;letter-spacing:6px;white-space:nowrap;">%s</p>
        <p class="email-muted" style="margin:10px 0 0;color:#617585;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;">Có hiệu lực trong 10 phút · Chỉ dùng một lần</p>
        </td></tr>
        </table>
        """.formatted(escape(code));
    var plainText = greeting + "\n\n" + intro + "\n\nMã xác thực: " + code
        + "\n\nMã có hiệu lực trong 10 phút và chỉ dùng một lần.\n\n" + disclaimer
        + "\n\nOlympic HUMG";
    return frame(recipient, "Mã xác thực tài khoản Olympic", "Xác thực email của bạn",
        "Hoàn tất đăng ký bằng mã xác thực trong email này.", greeting, intro, action, disclaimer, plainText);
  }

  public MailMessage link(String recipient, String displayName, String subject, String title,
      String intro, String actionLabel, String actionUrl, String disclaimer) {
    requireWebUrl(actionUrl);
    var greeting = greeting(displayName);
    var escapedUrl = escape(actionUrl);
    var action = """
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr><td class="email-button" align="center" bgcolor="#07549c" style="background-color:#07549c;border-radius:10px;">
        <a class="email-button-link" href="%s" style="display:inline-block;padding:14px 22px;border:1px solid #07549c;border-radius:10px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:700;text-decoration:none;">%s</a>
        </td></tr>
        </table>
        <p class="email-muted" style="margin:20px 0 8px;color:#617585;font-size:12px;line-height:20px;">Nếu nút không mở được, hãy sao chép đường dẫn này vào trình duyệt:</p>
        <p style="margin:0;font-size:12px;line-height:20px;word-break:break-all;overflow-wrap:anywhere;"><a class="email-link" href="%s" style="color:#07549c;text-decoration:underline;word-break:break-all;">%s</a></p>
        """.formatted(escapedUrl, escape(actionLabel), escapedUrl, escapedUrl);
    var plainText = greeting + "\n\n" + intro + "\n\n" + actionLabel + ":\n" + actionUrl
        + "\n\n" + disclaimer + "\n\nOlympic HUMG";
    return frame(recipient, subject, title, "Mở email để tiếp tục thao tác tài khoản Olympic.",
        greeting, intro, action, disclaimer, plainText);
  }

  private MailMessage frame(String recipient, String subject, String title, String preheader,
      String greeting, String intro, String action, String disclaimer, String plainText) {
    var values = Map.of("title", escape(title), "preheader", escape(preheader), "greeting", escape(greeting),
        "intro", escape(intro), "action", action, "disclaimer", escape(disclaimer));
    // Replace only placeholders in the original template. User names containing "{{action}}"
    // remain literal text and cannot trigger a second template substitution.
    var html = PLACEHOLDER.matcher(TEMPLATE)
        .replaceAll(match -> Matcher.quoteReplacement(values.get(match.group(1))));
    return new MailMessage(recipient, subject, html, true, plainText, LOGO);
  }

  private String greeting(String displayName) {
    return "Chào " + (StringUtils.hasText(displayName) ? displayName.trim() : "bạn") + ",";
  }

  private String escape(String value) {
    return HtmlUtils.htmlEscape(value, StandardCharsets.UTF_8.name());
  }

  private void requireWebUrl(String value) {
    URI uri;
    try {
      uri = URI.create(value);
    } catch (IllegalArgumentException exception) {
      throw new IllegalArgumentException("Mail action requires an absolute HTTP(S) URL");
    }
    if (!("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme()))
        || !StringUtils.hasText(uri.getHost()) || uri.getUserInfo() != null) {
      throw new IllegalArgumentException("Mail action requires an absolute HTTP(S) URL");
    }
  }

  private static String loadTemplate() {
    try {
      return new ClassPathResource("mail/auth-email.html").getContentAsString(StandardCharsets.UTF_8);
    } catch (IOException exception) {
      throw new IllegalStateException("Account email template is unavailable", exception);
    }
  }
}
