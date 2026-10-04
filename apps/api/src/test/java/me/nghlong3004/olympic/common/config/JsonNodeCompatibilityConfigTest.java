package me.nghlong3004.olympic.common.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
class JsonNodeCompatibilityConfigTest {
  private final JsonMapper mapper = JsonMapper.builder()
      .addModule(new JsonNodeCompatibilityConfig().legacyJsonNodeModule()).build();

  @Test
  void roundTripsNestedLegacyTreesAsJsonNotBeanFlags() {
    String json = """
        {"content":{"schemaVersion":1,"parts":[{"source":"\\\\frac{1}{2}","enabled":true}],
        "empty":null,"points":1.25},"answer":["a",2,false]}
        """;
    Payload value = mapper.readValue(json, Payload.class);
    assertThat(value.content().path("schemaVersion").asInt()).isEqualTo(1);
    assertThat(value.content().path("parts").get(0).path("source").asText()).isEqualTo("\\frac{1}{2}");
    assertThat(mapper.readTree(mapper.writeValueAsString(value))).isEqualTo(mapper.readTree(json));
  }

  @Test
  void handlesNullAndRejectsMalformedJson() {
    Payload value = mapper.readValue("{\"content\":null,\"answer\":null}", Payload.class);
    assertThat(value.content()).isNull();
    assertThat(mapper.readTree(mapper.writeValueAsString(value)).path("content").isNull()).isTrue();
    assertThatThrownBy(() -> mapper.readValue("{\"content\":[}", Payload.class))
        .isInstanceOf(RuntimeException.class);
  }

  record Payload(JsonNode content, JsonNode answer) {}
}
