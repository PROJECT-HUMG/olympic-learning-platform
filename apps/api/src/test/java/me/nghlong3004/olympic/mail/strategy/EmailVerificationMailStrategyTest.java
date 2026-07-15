package me.nghlong3004.olympic.mail.strategy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;

import java.util.Locale;
import me.nghlong3004.olympic.common.mail.model.MailRequest;
import me.nghlong3004.olympic.common.mail.model.MailType;
import me.nghlong3004.olympic.common.mail.strategy.EmailVerificationMailStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@ExtendWith(MockitoExtension.class)
class EmailVerificationMailStrategyTest {

  @Mock private MessageSource messageSource;
  private EmailVerificationMailStrategy strategy;

  @BeforeEach
  void setUp() {
    strategy = new EmailVerificationMailStrategy(messageSource);
  }

  @Test
  void buildMessageUsesEmailVerificationTemplateAndModel() {
    lenient().when(messageSource.getMessage(any(String.class), any(), any(Locale.class)))
        .thenAnswer(inv -> inv.<String>getArgument(0));
    lenient().when(messageSource.getMessage(eq("mail.verify.subject"), any(), any()))
        .thenReturn("Verify your VF QC Copilot account");
    lenient().when(messageSource.getMessage(eq("mail.verify.greeting"), any(), any()))
        .thenReturn("Hi QC Demo,");

    var request =
        MailRequest.builder()
            .to("qc.demo@example.com")
            .displayName("QC Demo")
            .actionUrl("https://app.example.test/verify-email?token=abc")
            .build();

    var message = strategy.buildMessage(request);

    assertThat(strategy.type()).isEqualTo(MailType.EMAIL_VERIFICATION);
    assertThat(message.to()).isEqualTo("qc.demo@example.com");
    assertThat(message.subject()).isEqualTo("Verify your VF QC Copilot account");
    assertThat(message.templatePath()).isEqualTo("templates/mail/email-verification.html");
    assertThat(message.model().get("appName")).isEqualTo("VF QC Copilot");
    assertThat(message.model().get("greeting")).isEqualTo("Hi QC Demo,");
    assertThat(message.model().get("actionUrl"))
        .isEqualTo("https://app.example.test/verify-email?token=abc");
  }
}
