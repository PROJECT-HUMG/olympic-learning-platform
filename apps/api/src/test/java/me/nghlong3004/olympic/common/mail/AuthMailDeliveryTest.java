package me.nghlong3004.olympic.common.mail;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.net.ServerSocket;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;
import me.nghlong3004.olympic.common.mail.impl.AdminInviteMailStrategy;
import me.nghlong3004.olympic.common.mail.impl.EmailVerificationMailStrategy;
import me.nghlong3004.olympic.common.mail.impl.JavaMailServiceImpl;
import me.nghlong3004.olympic.common.mail.impl.PasswordResetMailStrategy;
import me.nghlong3004.olympic.common.mail.impl.RegistrationOtpMailStrategy;
import me.nghlong3004.olympic.common.mail.model.AdminInviteMailModel;
import me.nghlong3004.olympic.common.mail.model.EmailVerificationMailModel;
import me.nghlong3004.olympic.common.mail.model.PasswordResetMailModel;
import me.nghlong3004.olympic.common.mail.model.RegistrationOtpMailModel;
import me.nghlong3004.olympic.common.properties.MailProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.support.StaticListableBeanFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.web.util.HtmlUtils;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
class AuthMailDeliveryTest {
  private static final String RECIPIENT = "recipient@example.invalid";
  private final AuthMailTemplate template = new AuthMailTemplate();

  static Stream<String> variants() {
    return Stream.of("otp", "reset", "invite", "verification");
  }

  private MailTemplateModel model(String variant, String name, String code, String link) {
    return switch (variant) {
      case "otp" -> new RegistrationOtpMailModel(RECIPIENT, name, code);
      case "reset" -> new PasswordResetMailModel(RECIPIENT, name, link);
      case "invite" -> new AdminInviteMailModel(RECIPIENT, name, link);
      default -> new EmailVerificationMailModel(RECIPIENT, name, link);
    };
  }

  private JavaMailServiceImpl service(JavaMailSender sender) {
    var provider = new StaticListableBeanFactory(Map.of("sender", sender)).getBeanProvider(JavaMailSender.class);
    List<MailStrategy<? extends MailTemplateModel>> strategies = List.of(
        new RegistrationOtpMailStrategy(template), new PasswordResetMailStrategy(template),
        new AdminInviteMailStrategy(template), new EmailVerificationMailStrategy(template));
    return new JavaMailServiceImpl(provider, new MailProperties(true, "no-reply@example.invalid"), strategies);
  }

  @ParameterizedTest
  @MethodSource("variants")
  void sendsEveryAccountMailAsUtf8AlternativesWithInlineLogoOverSmtp(String variant) throws Exception {
    var code = "012345";
    var token = UUID.randomUUID().toString();
    var link = "https://learn.example.invalid/reset-password?token=" + token + "&source=email";
    try (var smtp = new SmtpSink()) {
      var sender = new JavaMailSenderImpl();
      sender.setHost("127.0.0.1");
      sender.setPort(smtp.port());
      sender.getJavaMailProperties().setProperty("mail.smtp.connectiontimeout", "5000");
      sender.getJavaMailProperties().setProperty("mail.smtp.timeout", "5000");
      sender.getJavaMailProperties().setProperty("mail.smtp.writetimeout", "5000");
      service(sender).send(model(variant, "Minh Anh", code, link));
      var bytes = smtp.message.get(5, TimeUnit.SECONDS);
      var mime = new MimeMessage(Session.getInstance(new Properties()), new ByteArrayInputStream(bytes));
      assertThat(mime.isMimeType("multipart/related")).isTrue();
      assertThat(((InternetAddress) mime.getAllRecipients()[0]).getAddress()).isEqualTo(RECIPIENT);
      var parts = leaves(mime);
      assertThat(parts).hasSize(3);
      var plain = parts.stream().filter(part -> matches(part, "text/plain")).findFirst().orElseThrow();
      var htmlPart = parts.stream().filter(part -> matches(part, "text/html")).findFirst().orElseThrow();
      var image = parts.stream().filter(part -> matches(part, "image/png")).findFirst().orElseThrow();
      var html = (String) htmlPart.getContent();
      var text = (String) plain.getContent();
      assertThat(htmlPart.getContentType()).containsIgnoringCase("charset=UTF-8");
      assertThat(text).contains("Chào Minh Anh,");
      assertThat(html).contains("Chào Minh Anh,", "cid:olympic-logo", "lang=\"vi\"")
          .doesNotContain("<script", "@import", "https://fonts", "data:image", "{{");
      assertThat(html.getBytes(StandardCharsets.UTF_8).length).isLessThan(10_240);
      assertThat(image.getDisposition()).isEqualTo(Part.INLINE);
      assertThat(image.getHeader("Content-ID")[0]).isEqualTo("<olympic-logo>");
      byte[] expected;
      try (var stream = new ClassPathResource("mail/olympic-logo.png").getInputStream()) {
        expected = stream.readAllBytes();
      }
      assertThat(image.getInputStream().readAllBytes()).isEqualTo(expected);
      assertThat(expected.length).isLessThan(10_240);
      assertThat(bytes.length).isLessThan(32_768);
      if (variant.equals("otp")) {
        assertThat(html).contains(code, "10 phút").doesNotContain("href=", token);
        assertThat(text).contains(code, "10 phút").doesNotContain(token);
      } else {
        assertThat(html).contains("href=\"" + HtmlUtils.htmlEscape(link, "UTF-8") + "\"");
        assertThat(text).contains(link);
      }
      var preview = Path.of(System.getProperty("java.io.tmpdir"), "olympic-auth-mail-preview");
      Files.createDirectories(preview);
      Files.writeString(preview.resolve(variant + ".html"), html);
      Files.write(preview.resolve(variant + ".eml"), bytes);
      Files.write(preview.resolve("olympic-logo.png"), expected);
      System.out.println("Mail size " + variant + ": HTML=" + html.getBytes(StandardCharsets.UTF_8).length
          + " PNG=" + expected.length + " MIME=" + bytes.length + " bytes");
    }
  }

  @Test
  void escapesUserNamesAndDoesNotInterpretTemplateMarkersInThem() {
    var name = "<img src=x onerror=alert(1)> {{action}} & \"Long\"";
    var mail = template.otp(RECIPIENT, name, "012345");
    assertThat(mail.body()).contains(HtmlUtils.htmlEscape("Chào " + name + ",", "UTF-8"))
        .doesNotContain("<img src=x", "onerror=\"alert");
    assertThat(mail.plainTextBody()).contains(name, "012345");
    assertThat(mail.body().split("src=\"cid:olympic-logo\"", -1)).hasSize(2);
  }

  @Test
  void missingNameUsesFriendlyGreeting() {
    assertThat(template.otp(RECIPIENT, null, "012345").body()).contains("Chào bạn,");
    assertThat(template.otp(RECIPIENT, "  ", "012345").plainTextBody()).contains("Chào bạn,");
  }

  @Test
  void refusesUnsafeOrRelativeActionLinksWithoutEchoingTheUrl() {
    for (var url : List.of("javascript:alert(1)", "data:text/html,hello", "/relative", "https://bad path/?token=private",
        "https://user:password@example.invalid/path")) {
      assertThatThrownBy(() -> template.link(RECIPIENT, "Test", "Subject", "Title", "Intro", "Open", url, "Ignore"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Mail action requires an absolute HTTP(S) URL");
    }
  }

  @Test
  void disabledMailDoesNotTouchSenderOrBuildAMessage() {
    var sender = mock(JavaMailSender.class);
    var provider = new StaticListableBeanFactory(Map.of("sender", sender)).getBeanProvider(JavaMailSender.class);
    var mail = new JavaMailServiceImpl(provider, new MailProperties(false, null), List.of());
    mail.send(new RegistrationOtpMailModel(RECIPIENT, "Test", "012345"));
    verifyNoInteractions(sender);
  }

  @Test
  void legacyPlainTextMessagesRemainSinglePart() throws Exception {
    var sender = new JavaMailSenderImpl();
    try (var smtp = new SmtpSink()) {
      sender.setHost("127.0.0.1");
      sender.setPort(smtp.port());
      var provider = new StaticListableBeanFactory(Map.of("sender", sender)).getBeanProvider(JavaMailSender.class);
      MailStrategy<RegistrationOtpMailModel> plain = new MailStrategy<>() {
        @Override public Class<RegistrationOtpMailModel> modelType() { return RegistrationOtpMailModel.class; }
        @Override public MailMessage build(RegistrationOtpMailModel model) {
          return new MailMessage(model.recipientEmail(), "Plain fixture", "Hello", false);
        }
      };
      new JavaMailServiceImpl(provider, new MailProperties(true, null), List.of(plain))
          .send(new RegistrationOtpMailModel(RECIPIENT, "Test", "012345"));
      var mime = new MimeMessage(Session.getInstance(new Properties()),
          new ByteArrayInputStream(smtp.message.get(5, TimeUnit.SECONDS)));
      assertThat(mime.isMimeType("text/plain")).isTrue();
      assertThat((String) mime.getContent()).isEqualTo("Hello\r\n");
    }
  }

  private boolean matches(Part part, String type) {
    try { return part.isMimeType(type); }
    catch (Exception exception) { throw new IllegalStateException(exception); }
  }

  private List<Part> leaves(Part part) throws Exception {
    if (!part.isMimeType("multipart/*")) return List.of(part);
    var multipart = (Multipart) part.getContent();
    var result = new ArrayList<Part>();
    for (var index = 0; index < multipart.getCount(); index++) result.addAll(leaves(multipart.getBodyPart(index)));
    return result;
  }

  // Local SMTP sink: exercises the actual JavaMail transport without sending to any real mailbox.
  private static class SmtpSink implements AutoCloseable {
    final ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress());
    final ExecutorService worker = Executors.newSingleThreadExecutor();
    final CompletableFuture<byte[]> message = new CompletableFuture<>();

    SmtpSink() throws Exception {
      worker.submit(() -> {
        try (var socket = server.accept()) {
          socket.setSoTimeout(5000);
          var input = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
          var output = socket.getOutputStream();
          output.write("220 localhost test SMTP\r\n".getBytes(StandardCharsets.US_ASCII));
          output.flush();
          String line;
          while ((line = input.readLine()) != null) {
            var response = "250 OK\r\n";
            if (line.equals("DATA")) {
              output.write("354 Send message\r\n".getBytes(StandardCharsets.US_ASCII));
              output.flush();
              var data = new StringBuilder();
              while ((line = input.readLine()) != null && !line.equals(".")) {
                data.append(line.startsWith("..") ? line.substring(1) : line).append("\r\n");
              }
              message.complete(data.toString().getBytes(StandardCharsets.UTF_8));
            } else if (line.equals("QUIT")) {
              output.write("221 Bye\r\n".getBytes(StandardCharsets.US_ASCII));
              output.flush();
              break;
            }
            output.write(response.getBytes(StandardCharsets.US_ASCII));
            output.flush();
          }
        } catch (Exception exception) {
          message.completeExceptionally(exception);
        }
      });
    }
    int port() { return server.getLocalPort(); }
    @Override public void close() throws Exception { server.close(); worker.shutdownNow(); }
  }
}
