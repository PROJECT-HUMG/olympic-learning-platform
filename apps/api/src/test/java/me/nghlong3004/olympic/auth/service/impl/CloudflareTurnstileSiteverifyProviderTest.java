package me.nghlong3004.olympic.auth.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayOutputStream;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.concurrent.Flow;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import me.nghlong3004.olympic.common.properties.TurnstileProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@SuppressWarnings("unchecked")
class CloudflareTurnstileSiteverifyProviderTest {

  private static final String SECRET = "sample-secret";
  private static final String TOKEN = "sample-token";

  private final Logger logger =
      (Logger) LoggerFactory.getLogger(CloudflareTurnstileSiteverifyProvider.class);
  private final ListAppender<ILoggingEvent> logs = new ListAppender<>();
  private final HttpClient httpClient = mock(HttpClient.class);
  private final ObjectMapper objectMapper = new ObjectMapper();
  private CloudflareTurnstileSiteverifyProvider provider;

  @BeforeEach
  void setUp() {
    logs.start();
    logger.addAppender(logs);
    var properties =
        new TurnstileProperties(true, SECRET, "app.example.com", Duration.ofSeconds(2));
    provider = new CloudflareTurnstileSiteverifyProvider(httpClient, objectMapper, properties);
  }

  @AfterEach
  void tearDown() {
    logger.detachAppender(logs);
    Thread.interrupted();
  }

  @Test
  void postsJsonToTheFixedHttpsEndpointAndParsesHostnameAndAction() throws Exception {
    HttpRequest[] captured = new HttpRequest[1];
    when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
        .thenAnswer(
            invocation -> {
              captured[0] = invocation.getArgument(0);
              return jsonResponse(
                  200,
                  """
                  {"success":true,"hostname":"app.example.com","action":"register","challenge_ts":"2026-10-03T00:00:00Z"}
                  """);
            });

    var result = provider.siteverify(TOKEN);

    assertThat(result.success()).isTrue();
    assertThat(result.hostname()).isEqualTo("app.example.com");
    assertThat(result.action()).isEqualTo("register");
    assertThat(result.outage()).isFalse();
    assertThat(result.errorCodes()).isEmpty();
    assertThat(captured[0].uri())
        .isEqualTo(CloudflareTurnstileSiteverifyProvider.SITEVERIFY_ENDPOINT);
    assertThat(captured[0].uri().getScheme()).isEqualTo("https");
    assertThat(captured[0].uri().getRawQuery()).isNull();
    assertThat(captured[0].uri().toString()).doesNotContain(SECRET).doesNotContain(TOKEN);
    assertThat(captured[0].method()).isEqualTo("POST");
    assertThat(captured[0].timeout()).contains(Duration.ofSeconds(2));
    assertThat(captured[0].headers().firstValue("Content-Type")).contains("application/json");
    var body = objectMapper.readTree(body(captured[0]));
    var names = new ArrayList<String>();
    body.fieldNames().forEachRemaining(names::add);
    assertThat(names).containsExactlyInAnyOrder("secret", "response");
    assertThat(body.get("secret").asText()).isEqualTo(SECRET);
    assertThat(body.get("response").asText()).isEqualTo(TOKEN);
    verify(httpClient, times(1)).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
    assertLogsHideSecrets();
  }

  @Test
  void rejectedTokenStaysAVerdict() throws Exception {
    var response =
        jsonResponse(
            200,
            """
            {"success":false,"hostname":"app.example.com","action":"password_reset","error-codes":["timeout-or-duplicate"]}
            """);
    when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
        .thenReturn(response);

    var result = provider.siteverify(TOKEN);

    assertThat(result.outage()).isFalse();
    assertThat(result.success()).isFalse();
    assertThat(result.hostname()).isEqualTo("app.example.com");
    assertThat(result.action()).isEqualTo("password_reset");
    assertThat(result.errorCodes()).containsExactly("timeout-or-duplicate");
    assertLogsHideSecrets();
  }

  @Test
  void internalErrorAndSecretErrorsAreUnavailable() throws Exception {
    var internalError = jsonResponse(200, "{\"success\":false,\"error-codes\":[\"internal-error\"]}");
    var invalidSecret = jsonResponse(200, "{\"success\":false,\"error-codes\":[\"invalid-input-secret\"]}");
    var missingSecret = jsonResponse(200, "{\"success\":false,\"error-codes\":[\"missing-input-secret\"]}");
    var badRequest = jsonResponse(200, "{\"success\":false,\"error-codes\":[\"bad-request\"]}");
    var successWithInternalError =
        jsonResponse(200, "{\"success\":true,\"error-codes\":[\"internal-error\"],\"action\":\"register\"}");
    when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
        .thenReturn(internalError)
        .thenReturn(invalidSecret)
        .thenReturn(missingSecret)
        .thenReturn(badRequest)
        .thenReturn(successWithInternalError);

    for (var attempt = 0; attempt < 5; attempt++) {
      assertThat(provider.siteverify(TOKEN).outage()).isTrue();
    }
    assertLogsHideSecrets();
  }

  @Test
  void httpFailureTimeoutAndMalformedBodiesAreUnavailable() throws Exception {
    var http500 = jsonResponse(500, "{\"success\":true}");
    var http400 = jsonResponse(400, "{\"success\":false}");
    var redirect = jsonResponse(302, "");
    var notJson = jsonResponse(200, "not-json");
    var empty = jsonResponse(200, "");
    var stringSuccess = jsonResponse(200, "{\"success\":\"true\"}");
    var array = jsonResponse(200, "[]");
    var badErrorCodes = jsonResponse(200, "{\"success\":true,\"error-codes\":\"internal-error\"}");
    when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
        .thenReturn(http500)
        .thenReturn(http400)
        .thenReturn(redirect)
        .thenReturn(notJson)
        .thenReturn(empty)
        .thenReturn(stringSuccess)
        .thenReturn(array)
        .thenReturn(badErrorCodes)
        .thenThrow(new HttpTimeoutException("slow"))
        .thenThrow(new java.io.IOException("down"))
        .thenThrow(new InterruptedException("stopped"));

    for (var attempt = 0; attempt < 11; attempt++) {
      assertThat(provider.siteverify(TOKEN).outage()).isTrue();
    }
    assertThat(Thread.currentThread().isInterrupted()).isTrue();
    assertLogsHideSecrets();
  }

  private void assertLogsHideSecrets() {
    assertThat(logs.list)
        .allSatisfy(
            event -> {
              assertThat(event.getFormattedMessage()).doesNotContain(SECRET).doesNotContain(TOKEN);
              assertThat(event.getThrowableProxy()).isNull();
            });
  }

  private static HttpResponse<String> jsonResponse(int status, String body) {
    HttpResponse<String> response = mock(HttpResponse.class);
    when(response.statusCode()).thenReturn(status);
    when(response.body()).thenReturn(body);
    return response;
  }

  private static String body(HttpRequest request) throws Exception {
    var publisher = request.bodyPublisher().orElseThrow();
    var future = new CompletableFuture<String>();
    publisher.subscribe(
        new Flow.Subscriber<>() {
          private final ByteArrayOutputStream out = new ByteArrayOutputStream();

          @Override
          public void onSubscribe(Flow.Subscription subscription) {
            subscription.request(Long.MAX_VALUE);
          }

          @Override
          public void onNext(ByteBuffer item) {
            var bytes = new byte[item.remaining()];
            item.get(bytes);
            out.write(bytes, 0, bytes.length);
          }

          @Override
          public void onError(Throwable throwable) {
            future.completeExceptionally(throwable);
          }

          @Override
          public void onComplete() {
            future.complete(out.toString(StandardCharsets.UTF_8));
          }
        });
    return future.get(2, TimeUnit.SECONDS);
  }
}
