package me.nghlong3004.olympic.exam.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.exam.ExamLimits;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.Test;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
class ExamPlacementPolicyTest {
  private final ExamPlacementPolicy policy = new ExamPlacementPolicy();

  @Test
  void immutableEmptyAndNonemptyInputsAreSafe() {
    assertThatCode(() -> policy.requireItems(List.of(), false)).doesNotThrowAnyException();
    assertThatCode(() -> policy.requireItems(List.of("q"), true)).doesNotThrowAnyException();
    assertThat(policy.requireWeights(single(), new BigDecimal("2.00"), Map.of())).isEmpty();
    assertThat(policy.requireWeights(single(), new BigDecimal("2"), Map.of("p", new BigDecimal("2"))))
        .containsEntry("p", new BigDecimal("2.00"));
  }

  @Test
  void mutableNullMembersAreValidationErrors() {
    var items = new ArrayList<String>();
    items.add(null);
    invalid(() -> policy.requireItems(items, false), "Exam items are required");
    invalid(() -> policy.requireItems(null, true), "Exam items are required");
    var weights = new HashMap<String, BigDecimal>();
    weights.put("p", null);
    invalid(() -> policy.requireWeights(single(), new BigDecimal("2"), weights), "Points are required");
    invalid(() -> policy.requireWeights(single(), new BigDecimal("2"), null), "Part points are required");
  }

  @Test
  void placementCountAllowsDuplicatesThroughOneHundred() {
    assertThatCode(() -> policy.requireItems(Collections.nCopies(100, "q"), true))
        .doesNotThrowAnyException();
    assertThatCode(() -> policy.requireItems(List.of("q", "q"), true)).doesNotThrowAnyException();
    invalid(
        () -> policy.requireItems(Collections.nCopies(101, "q"), false),
        "An exam can contain at most 100 items");
    invalid(() -> policy.requireItems(List.of(), true), "Exam items are required");
  }

  @Test
  void pointsMatchTwoDecimalDigits() {
    assertThat(policy.requirePoints(new BigDecimal("0.01"))).isEqualTo(new BigDecimal("0.01"));
    assertThat(policy.requirePoints(new BigDecimal("1000"))).isEqualTo(new BigDecimal("1000.00"));
    assertThat(policy.requirePoints(new BigDecimal("1000.00"))).isEqualTo(new BigDecimal("1000.00"));
    invalid(() -> policy.requirePoints(BigDecimal.ZERO), "Points must be positive and at most 1000");
    invalid(() -> policy.requirePoints(new BigDecimal("1000.01")), "Points must be positive and at most 1000");
    invalid(() -> policy.requirePoints(new BigDecimal("1.001")), "Points support at most two decimal places");
    invalid(() -> policy.requirePoints(new BigDecimal("1.230")), "Points support at most two decimal places");
  }

  @Test
  void multipartKeysMustBeExactAndSum() {
    var weights = policy.requireWeights(
        multipart(), new BigDecimal("4"), Map.of("p2", new BigDecimal("2.5"), "p1", new BigDecimal("1.5")));
    assertThat(weights)
        .containsEntry("p1", new BigDecimal("1.50"))
        .containsEntry("p2", new BigDecimal("2.50"));
    invalid(
        () -> policy.requireWeights(
            multipart(), new BigDecimal("4"), Map.of("p1", new BigDecimal("1"), "p2", new BigDecimal("1"))),
        "Part points must sum to the item points");
    invalid(
        () -> policy.requireWeights(multipart(), new BigDecimal("4"), Map.of("p1", new BigDecimal("4"))),
        "Part points must use the question part ids");
  }

  @Test
  void nullTitleAndInstructionsBecomeEmptyUntilPublish() {
    assertThat(policy.title(null, false)).isEmpty();
    assertThat(policy.instructions(null)).isEmpty();
    assertThat(policy.title("  Midterm  ", true)).isEqualTo("  Midterm  ");
    invalid(() -> policy.title(null, true), "Exam title is required");
    invalid(() -> policy.title(" ", true), "Exam title is required");
  }

  @Test
  void textReleaseExtraKeyNegativePointAndOrderedWeights() {
    assertThat(policy.title("a".repeat(ExamLimits.MAX_TITLE), true)).hasSize(ExamLimits.MAX_TITLE);
    invalid(() -> policy.title("a".repeat(ExamLimits.MAX_TITLE + 1), false), "Exam title is too long");
    assertThat(policy.instructions("b".repeat(ExamLimits.MAX_INSTRUCTIONS)))
        .hasSize(ExamLimits.MAX_INSTRUCTIONS);
    invalid(
        () -> policy.instructions("b".repeat(ExamLimits.MAX_INSTRUCTIONS + 1)),
        "Instructions are too long");
    invalid(() -> policy.requireRelease(null), "Exam release time is required");
    assertThatCode(() -> policy.requireRelease(OffsetDateTime.parse("2026-10-03T00:00:00Z")))
        .doesNotThrowAnyException();
    var extra = new LinkedHashMap<String, BigDecimal>();
    extra.put("p1", new BigDecimal("1.00"));
    extra.put("p2", new BigDecimal("1.00"));
    extra.put("extra", new BigDecimal("2.00"));
    invalid(
        () -> policy.requireWeights(multipart(), new BigDecimal("4.00"), extra),
        "Part points must use the question part ids");
    invalid(() -> policy.requirePoints(new BigDecimal("-1.00")), "Points must be positive and at most 1000");
    invalid(() -> policy.requirePoints(null), "Points are required");
    var input = new LinkedHashMap<String, BigDecimal>();
    input.put("p2", new BigDecimal("2.50"));
    input.put("p1", new BigDecimal("1.50"));
    var weights = policy.requireWeights(multipart(), new BigDecimal("4.00"), input);
    assertThat(new ArrayList<>(weights.keySet())).containsExactly("p1", "p2");
    assertThatThrownBy(() -> weights.put("p3", new BigDecimal("1.00")))
        .isInstanceOf(UnsupportedOperationException.class);
    input.put("p2", new BigDecimal("9.00"));
    assertThat(weights).containsEntry("p2", new BigDecimal("2.50"));
  }

  private static ObjectNode single() {
    var node = JsonNodeFactory.instance.objectNode();
    node.put("structure", "SINGLE");
    node.putArray("parts").addObject().put("id", "p");
    return node;
  }

  private static ObjectNode multipart() {
    var node = JsonNodeFactory.instance.objectNode();
    node.put("structure", "MULTIPART");
    var parts = node.putArray("parts");
    parts.addObject().put("id", "p1");
    parts.addObject().put("id", "p2");
    return node;
  }

  private static void invalid(ThrowingCallable call, String message) {
    assertThatThrownBy(call)
        .isInstanceOf(ApiException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.VALIDATION_ERROR)
        .hasMessage(message);
  }
}
