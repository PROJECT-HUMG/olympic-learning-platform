package me.nghlong3004.olympic.common.mail.impl;

import jakarta.mail.MessagingException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.mail.MailDeliveryException;
import me.nghlong3004.olympic.common.mail.MailService;
import me.nghlong3004.olympic.common.mail.MailStrategy;
import me.nghlong3004.olympic.common.mail.MailTemplateModel;
import me.nghlong3004.olympic.common.properties.MailProperties;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@Service
@Slf4j
public class JavaMailServiceImpl implements MailService {

  private final ObjectProvider<JavaMailSender> mailSenderProvider;
  private final MailProperties properties;
  private final Map<Class<? extends MailTemplateModel>, MailStrategy<? extends MailTemplateModel>>
      strategies;

  public JavaMailServiceImpl(
      ObjectProvider<JavaMailSender> mailSenderProvider,
      MailProperties properties,
      List<MailStrategy<? extends MailTemplateModel>> strategies) {
    this.mailSenderProvider = mailSenderProvider;
    this.properties = properties;
    this.strategies =
        strategies.stream().collect(Collectors.toMap(MailStrategy::modelType, Function.identity()));
  }

  @Override
  public void send(MailTemplateModel model) {
    if (!properties.enabled()) {
      log.info(
          "Mail sending skipped because olympic.mail.enabled=false: model={}",
          model.getClass().getSimpleName());
      return;
    }
    var sender = mailSenderProvider.getIfAvailable();
    if (sender == null) {
      throw new MailDeliveryException("JavaMailSender is not configured");
    }
    var strategy = strategy(model);
    var message = strategy.build(model);
    try {
      var mimeMessage = sender.createMimeMessage();
      var multipart = message.plainTextBody() != null || !message.inlineResources().isEmpty();
      var helper = new MimeMessageHelper(mimeMessage,
          multipart ? MimeMessageHelper.MULTIPART_MODE_RELATED : MimeMessageHelper.MULTIPART_MODE_NO,
          StandardCharsets.UTF_8.name());
      helper.setFrom(properties.from());
      helper.setTo(message.to());
      helper.setSubject(message.subject());
      if (message.html() && message.plainTextBody() != null) {
        helper.setText(message.plainTextBody(), message.body());
      } else {
        helper.setText(message.body(), message.html());
      }
      // Inline resources must be added after the text/alternative parts.
      for (var resource : message.inlineResources()) {
        helper.addInline(resource.contentId(), new ClassPathResource(resource.classpathLocation()),
            resource.contentType());
      }
      sender.send(mimeMessage);
      log.info("Mail sent: model={} recipient={}", model.getClass().getSimpleName(), message.to());
    } catch (MessagingException | MailException exception) {
      throw new MailDeliveryException("Failed to send email", exception);
    }
  }

  @SuppressWarnings("unchecked")
  private MailStrategy<MailTemplateModel> strategy(MailTemplateModel model) {
    var strategy = strategies.get(model.getClass());
    if (strategy == null) {
      throw new MailDeliveryException(
          "No mail strategy registered for " + model.getClass().getSimpleName());
    }
    return (MailStrategy<MailTemplateModel>) strategy;
  }
}
