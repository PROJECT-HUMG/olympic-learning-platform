package me.nghlong3004.olympic.common.mail;

public interface MailStrategy<T extends MailTemplateModel> {

  Class<T> modelType();

  MailMessage build(T model);
}
