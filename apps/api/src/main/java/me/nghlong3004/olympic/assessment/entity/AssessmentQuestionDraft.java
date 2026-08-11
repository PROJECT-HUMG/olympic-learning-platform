package me.nghlong3004.olympic.assessment.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import me.nghlong3004.olympic.assessment.enums.AssessmentDraftStatus;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Entity
@Table(name = "assessment_question_drafts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentQuestionDraft {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "import_id", nullable = false)
  private AssessmentImport assessmentImport;

  @Column(nullable = false)
  private int ordinal;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  @Builder.Default
  private AssessmentDraftStatus status = AssessmentDraftStatus.NEEDS_REVIEW;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "content_json", nullable = false, columnDefinition = "jsonb")
  @Builder.Default
  private JsonNode contentJson = JsonNodeFactoryHolder.emptyObject();

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "answer_json", nullable = false, columnDefinition = "jsonb")
  @Builder.Default
  private JsonNode answerJson = JsonNodeFactoryHolder.emptyObject();

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "parser_payload_json", nullable = false, columnDefinition = "jsonb")
  @Builder.Default
  private JsonNode parserPayloadJson = JsonNodeFactoryHolder.emptyObject();

  @Column(precision = 5, scale = 4)
  private BigDecimal confidence;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "warnings_json", nullable = false, columnDefinition = "jsonb")
  @Builder.Default
  private JsonNode warningsJson = JsonNodeFactoryHolder.emptyArray();

  @Column(name = "source_page")
  private Integer sourcePage;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "source_bbox", columnDefinition = "jsonb")
  private JsonNode sourceBbox;

  @Column(name = "created_at", nullable = false, updatable = false)
  @Builder.Default
  private OffsetDateTime createdAt = OffsetDateTime.now();

  @Column(name = "updated_at", nullable = false)
  @Builder.Default
  private OffsetDateTime updatedAt = OffsetDateTime.now();

  @PreUpdate
  void preUpdate() {
    updatedAt = OffsetDateTime.now();
  }

  private static final class JsonNodeFactoryHolder {
    private static JsonNode emptyObject() {
      return com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
    }

    private static JsonNode emptyArray() {
      return com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.arrayNode();
    }
  }
}
