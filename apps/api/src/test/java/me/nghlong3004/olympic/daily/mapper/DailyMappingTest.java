package me.nghlong3004.olympic.daily.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.daily.entity.DailyPlan;
import me.nghlong3004.olympic.daily.entity.DailyTask;
import me.nghlong3004.olympic.daily.entity.DailyWeeklyReview;
import me.nghlong3004.olympic.daily.enums.DailyTaskPriority;
import me.nghlong3004.olympic.daily.enums.DailyTaskStatus;
import me.nghlong3004.olympic.daily.evidence.entity.DailyEvidence;
import me.nghlong3004.olympic.daily.evidence.enums.EvidenceKind;
import me.nghlong3004.olympic.daily.evidence.enums.EvidenceStage;
import me.nghlong3004.olympic.daily.evidence.mapper.EvidenceMapper;
import me.nghlong3004.olympic.daily.evidence.response.EvidenceMetadataResponse;
import me.nghlong3004.olympic.daily.feedback.entity.DailyFeedback;
import me.nghlong3004.olympic.daily.feedback.mapper.DailyFeedbackMapper;
import me.nghlong3004.olympic.daily.feedback.response.DailyFeedbackContributionResponse;
import me.nghlong3004.olympic.daily.response.DailyPlanResponse;
import me.nghlong3004.olympic.daily.response.DailyTaskResponse;
import me.nghlong3004.olympic.daily.response.DailyWeekResponse;
import me.nghlong3004.olympic.daily.sharing.enums.DailyShareAccess;
import me.nghlong3004.olympic.daily.sharing.mapper.SharedDailyMapper;
import me.nghlong3004.olympic.daily.sharing.response.SharedDailySummaryResponse;
import me.nghlong3004.olympic.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mapstruct.factory.Mappers;

/**
 * Structural mapping parity, including absent reviews and private evidence metadata.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/04/2026
 */
class DailyMappingTest {
  private final DailyMapper daily = Mappers.getMapper(DailyMapper.class);
  private final SharedDailyMapper sharing = Mappers.getMapper(SharedDailyMapper.class);
  private final EvidenceMapper evidence = Mappers.getMapper(EvidenceMapper.class);
  private final DailyFeedbackMapper feedback = Mappers.getMapper(DailyFeedbackMapper.class);
  private static final OffsetDateTime STAMP = OffsetDateTime.parse("2026-10-04T12:00:00Z");
  private static final LocalDate DATE = LocalDate.of(2026, 10, 5);

  @Test
  void planCopiesEveryFieldAndPreservesServiceOrderingAndStatistics() {
    var plan = plan();
    plan.setReviewReasons(null);
    plan.setReviewWentWell(" Well ");
    plan.setReviewTomorrow("Tomorrow");
    var later = task(plan, 8);
    var earlier = task(plan, 1);
    var tasks = List.of(daily.toTask(later), daily.toTask(earlier));
    assertThat(tasks.getFirst()).isEqualTo(new DailyTaskResponse(
        later.getId(), later.getTitle(), later.getPriority(), later.getStatus(), 8));
    var response = daily.toPlan(plan, tasks, true, 1, 2, 1, 2);
    assertThat(response).isEqualTo(new DailyPlanResponse(
        plan.getId(), plan.getOwnerId(), DATE, STAMP, true, null, " Well ", "Tomorrow", tasks,
        1, 2, 1, 2, STAMP, STAMP.plusMinutes(1), 5));
    assertThat(response.tasks()).isSameAs(tasks);
    assertThat(sharing.toSummary(response)).isEqualTo(new SharedDailySummaryResponse(
        plan.getId(), STAMP, true, 1, 2, 1, 2));
  }

  @Test
  void absentWeekReviewKeepsAllNullableFieldsAndRatesNull() {
    assertThat(daily.toWeek(DATE, null, 0, 7, 0, null, 0, 0, null, 0))
        .isEqualTo(new DailyWeekResponse(
            null, DATE, null, null, null, null, 0, 7, 0, null, 0, 0, null, 0, null));
  }

  @Test
  void savedWeekKeepsReflectionsVersionAndExactPrecomputedRates() {
    var review = new DailyWeeklyReview();
    review.setId(UUID.randomUUID());
    review.setRecurringUnfinished("Recurring");
    review.setIssues(null);
    review.setReflection("Reflection");
    review.setNextWeekChanges("Next");
    review.setVersion(9L);
    var completion = new BigDecimal("0.3333");
    var must = new BigDecimal("0.5000");
    assertThat(daily.toWeek(DATE, review, 4, 7, 3, completion, 2, 4, must, 1))
        .isEqualTo(new DailyWeekResponse(
            review.getId(), DATE, "Recurring", null, "Reflection", "Next", 4, 7, 3,
            completion, 2, 4, must, 1, 9L));
  }

  @Test
  void fileMetadataExcludesBytesAndDownloadClonesOriginalContent() {
    var task = task(plan(), 0);
    var bytes = new byte[] {1, 2, 3};
    var row = DailyEvidence.builder().id(UUID.randomUUID()).task(task)
        .stage(EvidenceStage.START).kind(EvidenceKind.FILE).originalName("original.pdf")
        .contentType("application/pdf").sizeBytes(3L).content(bytes).createdAt(STAMP).build();
    assertThat(evidence.toMetadata(row)).isEqualTo(new EvidenceMetadataResponse(
        row.getId(), task.getPlan().getId(), task.getId(), EvidenceStage.START, EvidenceKind.FILE,
        "original.pdf", "application/pdf", 3L, null, null, STAMP));
    var download = evidence.toDownload(row);
    assertThat(download.originalName()).isEqualTo("original.pdf");
    assertThat(download.content()).containsExactly(bytes).isNotSameAs(bytes);
    download.content()[0] = 9;
    assertThat(row.getContent()).containsExactly(1, 2, 3);
    assertThat(List.of(EvidenceMetadataResponse.class.getRecordComponents())
        .stream().map(c -> c.getName())).doesNotContain("content");
  }

  @Test
  void linkMetadataKeepsFileOnlyFieldsNull() {
    var task = task(plan(), 0);
    var row = DailyEvidence.builder().id(UUID.randomUUID()).task(task)
        .stage(EvidenceStage.FINISH).kind(EvidenceKind.LINK).url("https://example.invalid/work")
        .label("Work").createdAt(STAMP).build();
    assertThat(evidence.toMetadata(row)).isEqualTo(new EvidenceMetadataResponse(
        row.getId(), task.getPlan().getId(), task.getId(), EvidenceStage.FINISH, EvidenceKind.LINK,
        null, null, null, "https://example.invalid/work", "Work", STAMP));
  }

  @ParameterizedTest
  @NullSource
  @ValueSource(strings = {"", "   ", " Full Name "})
  void namesPreserveFallbackAndFeedbackFields(String fullName) {
    var user = new User();
    user.setId(UUID.randomUUID());
    user.setUsername("username");
    user.setFullName(fullName);
    var expectedName = fullName == null || fullName.isBlank() ? "username" : fullName;
    var row = DailyFeedback.builder().id(UUID.randomUUID()).authorId(user.getId()).text(" Text ")
        .createdAt(STAMP).updatedAt(STAMP.plusMinutes(1)).version(3L).build();
    var response = feedback.toContribution(row, user);
    assertThat(response).isEqualTo(new DailyFeedbackContributionResponse(
        row.getId(), user.getId(), expectedName, " Text ", STAMP, STAMP.plusMinutes(1), 3));
    assertThat(feedback.toResponse(List.of(response), 1).contributions()).containsExactly(response);
    assertThat(feedback.toResponse(List.of(response), 1).contributorCount()).isEqualTo(1);
    assertThat(sharing.toMember(user, DailyShareAccess.NOT_SHARED, null).displayName())
        .isEqualTo(expectedName);
  }

  @Test
  void notSharedSummaryRemainsExplicitlyNullEvenWithNonNullJsonDefault() throws Exception {
    var user = new User();
    user.setId(UUID.randomUUID());
    user.setUsername("member");
    var row = sharing.toMember(user, DailyShareAccess.NOT_SHARED, null);
    var json = new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL)
        .valueToTree(row);
    assertThat(json.has("summary")).isTrue();
    assertThat(json.get("summary").isNull()).isTrue();
    assertThat(row.access()).isEqualTo(DailyShareAccess.NOT_SHARED);
    var rows = List.of(row);
    var dashboard = sharing.toDashboard(UUID.randomUUID(), DATE, rows);
    assertThat(dashboard.members()).isSameAs(rows);
    assertThat(dashboard.date()).isEqualTo(DATE);
  }

  private DailyPlan plan() {
    var plan = new DailyPlan();
    plan.setId(UUID.randomUUID());
    plan.setOwnerId(UUID.randomUUID());
    plan.setPlanDate(DATE);
    plan.setFirstSubmittedAt(STAMP);
    plan.setCreatedAt(STAMP);
    plan.setUpdatedAt(STAMP.plusMinutes(1));
    plan.setVersion(5L);
    return plan;
  }

  private DailyTask task(DailyPlan plan, int position) {
    var task = new DailyTask();
    task.setId(UUID.randomUUID());
    task.setPlan(plan);
    task.setTitle("Task " + position);
    task.setPosition(position);
    task.setPriority(DailyTaskPriority.MUST);
    task.setStatus(DailyTaskStatus.COMPLETED);
    return task;
  }
}
