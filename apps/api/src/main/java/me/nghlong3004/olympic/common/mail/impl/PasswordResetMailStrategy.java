package me.nghlong3004.olympic.common.mail.impl;

import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.common.mail.AuthMailTemplate;
import me.nghlong3004.olympic.common.mail.MailMessage;
import me.nghlong3004.olympic.common.mail.MailStrategy;
import me.nghlong3004.olympic.common.mail.model.PasswordResetMailModel;
import org.springframework.stereotype.Component;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@Component
@RequiredArgsConstructor
public class PasswordResetMailStrategy implements MailStrategy<PasswordResetMailModel> {
  private final AuthMailTemplate template;

  @Override
  public Class<PasswordResetMailModel> modelType() {
    return PasswordResetMailModel.class;
  }

  @Override
  public MailMessage build(PasswordResetMailModel model) {
    return template.link(model.recipientEmail(), model.displayName(),
        "Đặt lại mật khẩu Olympic", "Đặt lại mật khẩu",
        "Bạn vừa yêu cầu đặt lại mật khẩu. Mở trang bên dưới để tạo mật khẩu mới.",
        "Đặt lại mật khẩu", model.resetLink(),
        "Liên kết chỉ dùng một lần. Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này. Mật khẩu của bạn vẫn giữ nguyên.");
  }
}
