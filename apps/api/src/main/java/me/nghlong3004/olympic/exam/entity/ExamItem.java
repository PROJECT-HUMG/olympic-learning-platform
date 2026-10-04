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
 * Ordered draft placement. Points and instructions stay on the exam.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Entity
@Table(name = "exam_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamItem {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "exam_id", nullable = false, updatable = false)
  private UUID examId;

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
}
