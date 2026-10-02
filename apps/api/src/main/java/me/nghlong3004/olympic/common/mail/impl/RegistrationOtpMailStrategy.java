package me.nghlong3004.olympic.common.mail.impl;

import me.nghlong3004.olympic.common.mail.MailMessage;
import me.nghlong3004.olympic.common.mail.MailStrategy;
import me.nghlong3004.olympic.common.mail.model.RegistrationOtpMailModel;
import org.springframework.stereotype.Component;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@Component
public class RegistrationOtpMailStrategy implements MailStrategy<RegistrationOtpMailModel> {
  @Override
  public Class<RegistrationOtpMailModel> modelType() { return RegistrationOtpMailModel.class; }

  @Override
  public MailMessage build(RegistrationOtpMailModel model) {
    return new MailMessage(model.recipientEmail(), "Mã xác thực tài khoản Olympic",
        """
        Chào %s,

        Mã xác thực email của bạn là: %s

        Mã có hiệu lực trong 10 phút và chỉ dùng một lần.
        Nhập mã trên màn hình đăng ký Olympic. Không chia sẻ mã với người khác.
        Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.
        """.formatted(model.displayName(), model.code()), false);
  }
}
