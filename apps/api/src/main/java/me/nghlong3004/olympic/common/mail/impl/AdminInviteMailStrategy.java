package me.nghlong3004.olympic.common.mail.impl;

import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.common.mail.AuthMailTemplate;
import me.nghlong3004.olympic.common.mail.MailMessage;
import me.nghlong3004.olympic.common.mail.MailStrategy;
import me.nghlong3004.olympic.common.mail.model.AdminInviteMailModel;
import org.springframework.stereotype.Component;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@Component
@RequiredArgsConstructor
public class AdminInviteMailStrategy implements MailStrategy<AdminInviteMailModel> {
  private final AuthMailTemplate template;

  @Override
  public Class<AdminInviteMailModel> modelType() {
    return AdminInviteMailModel.class;
  }

  @Override
  public MailMessage build(AdminInviteMailModel model) {
    return template.link(model.recipientEmail(), model.displayName(),
        "Lời mời tham gia Olympic", "Tài khoản của bạn đã sẵn sàng",
        "Quản trị viên đã tạo tài khoản Olympic cho bạn. Đặt mật khẩu để kích hoạt tài khoản và bắt đầu học.",
        "Thiết lập tài khoản", model.inviteLink(),
        "Liên kết chỉ dùng một lần. Nếu bạn không mong đợi lời mời này, hãy bỏ qua email này.");
  }
}
