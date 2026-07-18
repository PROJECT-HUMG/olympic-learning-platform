package me.nghlong3004.olympic.common.mail.impl;

import me.nghlong3004.olympic.common.mail.MailMessage;
import me.nghlong3004.olympic.common.mail.MailStrategy;
import me.nghlong3004.olympic.common.mail.model.PasswordResetMailModel;
import org.springframework.stereotype.Component;

@Component
public class PasswordResetMailStrategy implements MailStrategy<PasswordResetMailModel> {

  @Override
  public Class<PasswordResetMailModel> modelType() {
    return PasswordResetMailModel.class;
  }

  @Override
  public MailMessage build(PasswordResetMailModel model) {
    return new MailMessage(
        model.recipientEmail(),
        "Reset your VFQC password",
        """
        Hello %s,

        Reset your VFQC password by opening this link:
        %s

        If you did not request a password reset, ignore this email.
        """
            .formatted(model.displayName(), model.resetLink()),
        false);
  }
}
