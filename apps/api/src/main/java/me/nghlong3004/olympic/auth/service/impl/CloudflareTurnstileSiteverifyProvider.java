package me.nghlong3004.olympic.auth.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.auth.dto.TurnstileSiteverifyResponse;
import me.nghlong3004.olympic.auth.service.TurnstileSiteverifyProvider;
import me.nghlong3004.olympic.common.properties.TurnstileProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CloudflareTurnstileSiteverifyProvider implements TurnstileSiteverifyProvider {

  static final URI SITEVERIFY_ENDPOINT =
      URI.create("https://challenges.cloudflare.com/turnstile/v0/siteverify");

  private static final Set<String> UNAVAILABLE_ERROR_CODES =
      Set.of("internal-error", "missing-input-secret", "invalid-input-secret", "bad-request");

  private final HttpClient turnstileHttpClient;
  private final ObjectMapper objectMapper;
  private final TurnstileProperties properties;

  @Override
  public TurnstileSiteverifyResponse siteverify(String token) {
    try {
      var response =
          turnstileHttpClient.send(request(token), HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() != 200) {
        log.warn("Turnstile siteverify failed: httpStatus={}", response.statusCode());
        return TurnstileSiteverifyResponse.unreachable();
      }
      return parse(response.body());
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      log.warn("Turnstile siteverify interrupted");
      return TurnstileSiteverifyResponse.unreachable();
    } catch (IOException exception) {
      if (exception instanceof HttpTimeoutException) {
        log.warn("Turnstile siteverify timed out");
      } else {
        log.warn("Turnstile siteverify request failed");
      }
      return TurnstileSiteverifyResponse.unreachable();
    }
  }

  private HttpRequest request(String token) throws JsonProcessingException {
    var payload = objectMapper.createObjectNode();
    payload.put("secret", properties.secretKey());
    payload.put("response", token);
    return HttpRequest.newBuilder(SITEVERIFY_ENDPOINT)
        .timeout(properties.timeout())
        .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
        .build();
  }

  private TurnstileSiteverifyResponse parse(String body) {
    if (body == null || body.isBlank()) {
      log.warn("Turnstile siteverify returned a malformed payload");
      return TurnstileSiteverifyResponse.unreachable();
    }
    final JsonNode node;
    try {
      node = objectMapper.readTree(body);
    } catch (JsonProcessingException exception) {
      log.warn("Turnstile siteverify returned a malformed payload");
      return TurnstileSiteverifyResponse.unreachable();
    }
    if (node == null || !node.isObject() || !node.path("success").isBoolean()) {
      log.warn("Turnstile siteverify returned a malformed payload");
      return TurnstileSiteverifyResponse.unreachable();
    }
    var errorCodes = errorCodes(node.get("error-codes"));
    if (errorCodes == null) {
      return TurnstileSiteverifyResponse.unreachable();
    }
    if (errorCodes.stream().anyMatch(UNAVAILABLE_ERROR_CODES::contains)) {
      log.warn("Turnstile siteverify reported an unavailable result");
      return TurnstileSiteverifyResponse.unreachable();
    }
    return TurnstileSiteverifyResponse.verdict(
        node.get("success").booleanValue(), text(node.get("hostname")), text(node.get("action")), errorCodes);
  }

  private List<String> errorCodes(JsonNode node) {
    if (node == null || node.isNull() || node.isMissingNode()) {
      return List.of();
    }
    if (!node.isArray()) {
      log.warn("Turnstile siteverify returned a malformed payload");
      return null;
    }
    var codes = new ArrayList<String>();
    for (var item : node) {
      if (!item.isTextual()) {
        log.warn("Turnstile siteverify returned a malformed payload");
        return null;
      }
      codes.add(item.asText());
    }
    return List.copyOf(codes);
  }

  private static String text(JsonNode node) {
    if (node == null || node.isNull() || node.isMissingNode() || !node.isTextual()) {
      return null;
    }
    var value = node.asText();
    return value.isBlank() ? null : value;
  }
}
