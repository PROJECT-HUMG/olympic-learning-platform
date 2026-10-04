package me.nghlong3004.olympic.common.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.core.JsonGenerator;
import tools.jackson.core.JsonParser;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.ValueSerializer;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.module.SimpleModule;

/**
 * Bridges existing persistence JSON trees into Boot 4's HTTP mapper without replacing either mapper.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Configuration
public class JsonNodeCompatibilityConfig {
  private static final ObjectMapper LEGACY_MAPPER = new ObjectMapper();
  private static final JsonMapper HTTP_TREE_MAPPER = JsonMapper.builder().build();

  @Bean
  public SimpleModule legacyJsonNodeModule() {
    SimpleModule module = new SimpleModule("legacy-json-node");
    module.addSerializer(JsonNode.class, new ValueSerializer<JsonNode>() {
      @Override
      public void serialize(JsonNode value, JsonGenerator generator, SerializationContext context) {
        // Parse rather than emit raw JSON; authored strings remain strings, never executable markup.
        generator.writeTree(HTTP_TREE_MAPPER.readTree(value.toString()));
      }
    });
    module.addDeserializer(JsonNode.class, new ValueDeserializer<JsonNode>() {
      @Override
      public JsonNode deserialize(JsonParser parser, DeserializationContext context) {
        // The HTTP parser enforces its normal stream constraints before conversion.
        String json = context.readTree(parser).toString();
        try {
          return LEGACY_MAPPER.readTree(json);
        } catch (JsonProcessingException exception) {
          return context.reportInputMismatch(JsonNode.class, "Invalid JSON tree");
        }
      }
    });
    return module;
  }
}
