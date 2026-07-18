package me.nghlong3004.olympic.common.mail;

public record MailMessage(String to, String subject, String body, boolean html) {}
