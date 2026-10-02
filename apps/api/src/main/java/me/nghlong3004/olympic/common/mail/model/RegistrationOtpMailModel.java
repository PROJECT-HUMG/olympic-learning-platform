package me.nghlong3004.olympic.common.mail.model;

import me.nghlong3004.olympic.common.mail.MailTemplateModel;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
public record RegistrationOtpMailModel(String recipientEmail, String displayName, String code)
    implements MailTemplateModel {}
