package me.nghlong3004.olympic.question.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import me.nghlong3004.olympic.assessment.entity.AssessmentQuestionDraft;
import me.nghlong3004.olympic.document.entity.Subject;
import me.nghlong3004.olympic.question.enums.QuestionStatus;
import me.nghlong3004.olympic.topic.entity.Topic;
import me.nghlong3004.olympic.user.entity.User;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Canonical reusable question independent from an imported source document.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Entity
@Table(name = "questions")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Question {
  @Id @GeneratedValue(strategy = GenerationType.UUID)
  @Column(nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "subject_id", nullable = false)
  private Subject subject;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "topic_id", nullable = false)
  private Topic topic;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "created_by", nullable = false)
  private User createdBy;
  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "source_draft_id")
  private AssessmentQuestionDraft sourceDraft;

  @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
  @Builder.Default private QuestionStatus status = QuestionStatus.DRAFT;
  @Column(nullable = false, length = 80) private String type;
  @JdbcTypeCode(SqlTypes.JSON) @Column(name = "content_json", nullable = false, columnDefinition = "jsonb")
  @Builder.Default private JsonNode contentJson = JsonDefaults.object();
  @JdbcTypeCode(SqlTypes.JSON) @Column(name = "answer_json", nullable = false, columnDefinition = "jsonb")
  @Builder.Default private JsonNode answerJson = JsonDefaults.object();
  @JdbcTypeCode(SqlTypes.JSON) @Column(name = "explanation_json", nullable = false, columnDefinition = "jsonb")
  @Builder.Default private JsonNode explanationJson = JsonDefaults.object();
  @Column(length = 30) private String difficulty;
  @Column(name = "published_at") private OffsetDateTime publishedAt;
  @Column(name = "archived_at") private OffsetDateTime archivedAt;
  @Column(name = "created_at", nullable = false, updatable = false) @Builder.Default private OffsetDateTime createdAt = OffsetDateTime.now();
  @Column(name = "updated_at", nullable = false) @Builder.Default private OffsetDateTime updatedAt = OffsetDateTime.now();
  @PreUpdate void preUpdate() { updatedAt = OffsetDateTime.now(); }

  private static final class JsonDefaults {
    static JsonNode object() { return com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode(); }
  }
}
