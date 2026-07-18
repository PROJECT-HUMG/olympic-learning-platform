package me.nghlong3004.olympic.common.mail.model;

import me.nghlong3004.olympic.common.mail.MailTemplateModel;

public record AdminInviteMailModel(String recipientEmail, String displayName, String inviteLink)
    implements MailTemplateModel {}
