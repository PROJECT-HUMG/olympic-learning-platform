package me.nghlong3004.olympic.common.mail.impl;

import lombok.RequiredArgsConstructor;
import me.nghlong3004.olympic.common.mail.AuthMailTemplate;
import me.nghlong3004.olympic.common.mail.MailMessage;
import me.nghlong3004.olympic.common.mail.MailStrategy;
import me.nghlong3004.olympic.common.mail.model.RegistrationOtpMailModel;
import org.springframework.stereotype.Component;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@Component
@RequiredArgsConstructor
public class RegistrationOtpMailStrategy implements MailStrategy<RegistrationOtpMailModel> {
  private final AuthMailTemplate template;

  @Override
  public Class<RegistrationOtpMailModel> modelType() {
    return RegistrationOtpMailModel.class;
  }

  @Override
  public MailMessage build(RegistrationOtpMailModel model) {
    return template.otp(model.recipientEmail(), model.displayName(), model.code());
  }
}
