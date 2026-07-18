package me.nghlong3004.olympic.common.mail.model;

import me.nghlong3004.olympic.common.mail.MailTemplateModel;

public record EmailVerificationMailModel(
    String recipientEmail, String displayName, String verificationLink)
    implements MailTemplateModel {}
