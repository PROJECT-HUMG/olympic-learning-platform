package me.nghlong3004.olympic.common.mail.impl;

import org.springframework.stereotype.Component;

@Component
public class AdminInviteMailStrategy implements MailStrategy<AdminInviteMailModel> {

  @Override
  public Class<AdminInviteMailModel> modelType() {
    return AdminInviteMailModel.class;
  }

  @Override
  public MailMessage build(AdminInviteMailModel model) {
    return new MailMessage(
        model.recipientEmail(),
        "Set up your VFQC account",
        """
        Hello %s,

        An administrator created a VFQC account for you.
        Use this link to set your password and activate the account:
        %s

        If you did not expect this invitation, ignore this email.
        """
            .formatted(model.displayName(), model.inviteLink()),
        false);
  }
}
