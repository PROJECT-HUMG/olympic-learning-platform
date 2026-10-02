package me.nghlong3004.olympic.common.mail.impl;

import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.common.mail.AuthMailTemplate;
import me.nghlong3004.olympic.common.mail.MailMessage;
import me.nghlong3004.olympic.common.mail.MailStrategy;
import me.nghlong3004.olympic.common.mail.model.EmailVerificationMailModel;
import org.springframework.stereotype.Component;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@Component
@RequiredArgsConstructor
public class EmailVerificationMailStrategy implements MailStrategy<EmailVerificationMailModel> {
  private final AuthMailTemplate template;

  @Override
  public Class<EmailVerificationMailModel> modelType() {
    return EmailVerificationMailModel.class;
  }

  @Override
  public MailMessage build(EmailVerificationMailModel model) {
    return template.link(model.recipientEmail(), model.displayName(),
        "Xác thực email tài khoản Olympic", "Xác thực email của bạn",
        "Mở trang xác thực bên dưới để hoàn tất việc kích hoạt tài khoản Olympic.",
        "Xác thực email", model.verificationLink(),
        "Liên kết chỉ dùng một lần. Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.");
  }
}
