package me.nghlong3004.olympic.exam.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Frozen scientific placement. Legacy asset URLs are not stored.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Entity
@Table(name = "exam_paper_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamPaperItem {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "paper_id", nullable = false, updatable = false)
  private UUID paperId;

  @Column(name = "position", nullable = false, updatable = false)
  private int position;

  @Column(name = "question_id", nullable = false, updatable = false)
  private UUID questionId;

  @Column(name = "points", nullable = false, precision = 8, scale = 2, updatable = false)
  private BigDecimal points;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "part_points", nullable = false, columnDefinition = "jsonb", updatable = false)
  private JsonNode partPoints;

  @Column(name = "instructions", nullable = false, length = 4000, updatable = false)
  private String instructions;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "content_json", nullable = false, columnDefinition = "jsonb", updatable = false)
  private JsonNode contentJson;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "answer_json", nullable = false, columnDefinition = "jsonb", updatable = false)
  private JsonNode answerJson;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "explanation_json", nullable = false, columnDefinition = "jsonb", updatable = false)
  private JsonNode explanationJson;
}
