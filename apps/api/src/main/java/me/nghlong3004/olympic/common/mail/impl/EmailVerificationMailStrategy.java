package me.nghlong3004.olympic.common.mail.impl;

import org.springframework.stereotype.Component;

@Component
public class EmailVerificationMailStrategy implements MailStrategy<EmailVerificationMailModel> {

  @Override
  public Class<EmailVerificationMailModel> modelType() {
    return EmailVerificationMailModel.class;
  }

  @Override
  public MailMessage build(EmailVerificationMailModel model) {
    return new MailMessage(
        model.recipientEmail(),
        "Verify your VFQC account",
        """
        Hello %s,

        Verify your VFQC account by opening this link:
        %s

        If you did not create this account, ignore this email.
        """
            .formatted(model.displayName(), model.verificationLink()),
        false);
  }
}
