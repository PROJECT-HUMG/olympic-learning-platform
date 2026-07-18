package me.nghlong3004.olympic.common.mail.event;

/**
 * Domain event published inside a {@code @Transactional} method so that mail delivery is deferred
 * until after the transaction commits successfully. This prevents SMTP timeouts from holding open
 * database connections.
 *
 * @param model the mail template model to send
 */
public record MailSendEvent(MailTemplateModel model) {}
