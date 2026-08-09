package me.nghlong3004.olympic.assessment.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import me.nghlong3004.olympic.assessment.enums.AssessmentAssetRole;
import me.nghlong3004.olympic.storage.entity.File;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Entity
@Table(name = "assessment_question_draft_assets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentQuestionDraftAsset {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(nullable = false, updatable = false)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "draft_id", nullable = false)
  private AssessmentQuestionDraft draft;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "file_id", nullable = false)
  private File file;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 40)
  private AssessmentAssetRole role;

  @Column(name = "sort_order", nullable = false)
  @Builder.Default
  private int sortOrder = 0;

  @Column(name = "alt_text", length = 500)
  private String altText;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "crop_json", nullable = false, columnDefinition = "jsonb")
  @Builder.Default
  private JsonNode cropJson = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

  @Column(name = "created_at", nullable = false, updatable = false)
  @Builder.Default
  private OffsetDateTime createdAt = OffsetDateTime.now();
}
