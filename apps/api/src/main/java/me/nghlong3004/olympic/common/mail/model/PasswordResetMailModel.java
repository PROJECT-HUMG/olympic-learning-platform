package me.nghlong3004.olympic.common.mail.model;

import me.nghlong3004.olympic.common.mail.MailTemplateModel;

public record PasswordResetMailModel(String recipientEmail, String displayName, String resetLink)
    implements MailTemplateModel {}
