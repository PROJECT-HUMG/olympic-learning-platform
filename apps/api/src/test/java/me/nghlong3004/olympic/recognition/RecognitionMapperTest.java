package me.nghlong3004.olympic.recognition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;
import me.nghlong3004.olympic.recognition.dto.AchievementMappingSource;
import me.nghlong3004.olympic.recognition.entity.Achievement;
import me.nghlong3004.olympic.recognition.entity.Honor;
import me.nghlong3004.olympic.recognition.entity.HonorParticipant;
import me.nghlong3004.olympic.recognition.entity.RecognitionFile;
import me.nghlong3004.olympic.recognition.enums.AchievementAward;
import me.nghlong3004.olympic.recognition.enums.AchievementCategory;
import me.nghlong3004.olympic.recognition.enums.AchievementStatus;
import me.nghlong3004.olympic.recognition.enums.HonorScope;
import me.nghlong3004.olympic.recognition.enums.HonorStatus;
import me.nghlong3004.olympic.recognition.mapper.RecognitionMapper;
import me.nghlong3004.olympic.recognition.repository.AchievementRepository;
import me.nghlong3004.olympic.recognition.repository.RecognitionFileRepository;
import me.nghlong3004.olympic.recognition.response.AchievementResponse;
import me.nghlong3004.olympic.recognition.response.HonorParticipantResponse;
import me.nghlong3004.olympic.recognition.response.RecognitionFileResponse;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
class RecognitionMapperTest {
  private final RecognitionMapper mapper = Mappers.getMapper(RecognitionMapper.class);
  private final OffsetDateTime created = OffsetDateTime.of(2026, 3, 1, 8, 0, 0, 0, ZoneOffset.UTC);
  private final OffsetDateTime updated = created.plusDays(1);

  @Test
  void participantsKeepOrderNullsAndDoNotFollowTheEntityWhenOverridden() {
    var account = UUID.randomUUID();
    var guest = new HonorParticipant(null, "Guest", null);
    var linked = new HonorParticipant(account, "Student", "First");
    assertThatThrownBy(() -> mapper.toParticipant(null)).isInstanceOf(NullPointerException.class);
    assertThatThrownBy(() -> mapper.toParticipants(null)).isInstanceOf(NullPointerException.class);
    var nullElement = new ArrayList<HonorParticipant>();
    nullElement.add(guest);
    nullElement.add(null);
    assertThatThrownBy(() -> mapper.toParticipants(nullElement)).isInstanceOf(NullPointerException.class);
    var empty = mapper.toParticipants(List.of());
    assertThat(empty).isEmpty();
    assertThatThrownBy(() -> empty.add(new HonorParticipantResponse(null, "X", null, null, null, false)))
        .isInstanceOf(UnsupportedOperationException.class);
    var participants = mapper.toParticipants(List.of(guest, linked));
    assertThat(participants).containsExactly(
        new HonorParticipantResponse(null, "Guest", null, null, null, false),
        new HonorParticipantResponse(account, "Student", "First", null, null, false));
    assertThatThrownBy(() -> participants.add(new HonorParticipantResponse(account, "X", null, null, null, false)))
        .isInstanceOf(UnsupportedOperationException.class);

    var honor = Honor.builder().id(UUID.randomUUID()).title("Album").subject("Math").year(2024)
        .description(null).scope(HonorScope.SCHOOL).status(HonorStatus.DRAFT)
        .participants(List.of(linked, guest)).createdBy(account).createdAt(created).updatedAt(updated).version(2)
        .build();
    var reversed = List.of(
        new HonorParticipantResponse(null, "Guest", null, null, null, false),
        new HonorParticipantResponse(account, "Student", "First", null, null, false));
    var second = UUID.randomUUID();
    var first = UUID.randomUUID();
    var photos = List.of(
        new RecognitionFileResponse(second, "b.png", "image/png", 2, "/b"),
        new RecognitionFileResponse(first, "a.png", "image/png", 1, null));
    var response = mapper.toHonor(honor, reversed, photos);
    assertThat(response.participants()).isSameAs(reversed);
    assertThat(response.photos()).isSameAs(photos);
    assertThat(response.description()).isNull();
    assertThat(response.status()).isEqualTo(HonorStatus.DRAFT);
    assertThat(response.version()).isEqualTo(2);
  }

  @Test
  void privilegedAndUnprivilegedProjectionsPreserveEvidenceOrderAndHiddenFields() {
    var id = UUID.randomUUID();
    var owner = UUID.randomUUID();
    var reviewedAt = updated.plusHours(2);
    var achievement = Achievement.builder().id(id).userId(owner).title("Paper").description(null)
        .category(AchievementCategory.OLYMPIC_NATIONAL).award(AchievementAward.FIRST).includeParticipation(true)
        .achievedDate(LocalDate.of(2024, 5, 1)).publicVisible(true).status(AchievementStatus.APPROVED)
        .awardPoints(10).participationPoints(6).reviewNote("secret").reviewedAt(reviewedAt)
        .createdAt(created).updatedAt(updated).version(4).build();
    var later = new RecognitionFileResponse(UUID.randomUUID(), "later.pdf", "application/pdf", 8, null);
    var earlier = new RecognitionFileResponse(UUID.randomUUID(), "earlier.pdf", "application/pdf", 4, null);
    var evidence = List.of(earlier, later);
    var shown = mapper.toAchievement(new AchievementMappingSource(
        achievement, "Student", "secret", reviewedAt, 99, evidence));
    assertThat(shown.reviewNote()).isEqualTo("secret");
    assertThat(shown.reviewedAt()).isEqualTo(reviewedAt);
    assertThat(shown.evidence()).isSameAs(evidence);
    assertThat(shown.totalPoints()).isEqualTo(99);
    assertThat(shown.fullName()).isEqualTo("Student");
    assertThat(shown.description()).isNull();

    var hiddenEvidence = List.<RecognitionFileResponse>of();
    var hidden = mapper.toAchievement(new AchievementMappingSource(
        achievement, "Student", null, null, 99, hiddenEvidence));
    assertThat(hidden.reviewNote()).isNull();
    assertThat(hidden.reviewedAt()).isNull();
    assertThat(hidden.evidence()).isSameAs(hiddenEvidence);
    assertThat(hidden.awardPoints()).isEqualTo(10);
    assertThat(hidden.participationPoints()).isEqualTo(6);
  }

  @Test
  void profileRankingAndFilesCopyPreparedValuesWithoutRecomputingPoints() {
    var userId = UUID.randomUUID();
    var ranking = mapper.toRanking(new Rank(2, userId, "Student", "student", 40, 3));
    assertThat(ranking.rank()).isEqualTo(2);
    assertThat(ranking.userId()).isEqualTo(userId);
    assertThat(ranking.fullName()).isEqualTo("Student");
    assertThat(ranking.username()).isEqualTo("student");
    assertThat(ranking.totalPoints()).isEqualTo(40);
    assertThat(ranking.approvedCount()).isEqualTo(3);

    var fileId = UUID.randomUUID();
    var metadata = new FileMetadata(fileId, "proof.png", "image/png", 3, 1);
    assertThatThrownBy(() -> mapper.toFile(null, "/x")).isInstanceOf(NullPointerException.class);
    assertThat(mapper.toFile(metadata, null).url()).isNull();
    assertThat(mapper.toFile(metadata, "/api/v1/recognition/honors/x/photos/" + fileId))
        .isEqualTo(new RecognitionFileResponse(fileId, "proof.png", "image/png", 3,
            "/api/v1/recognition/honors/x/photos/" + fileId));
  }

  @Test
  void downloadKeepsTheSameEvidenceBytes() {
    byte[] bytes = {1, 2, 3};
    var file = RecognitionFile.builder().originalName("proof.png").contentType("image/png").size(3)
        .position(0).content(bytes).build();
    var download = mapper.toDownload(file);
    assertThat(download.originalName()).isEqualTo("proof.png");
    assertThat(download.contentType()).isEqualTo("image/png");
    assertThat(download.content()).isSameAs(bytes);
    bytes[0] = 9;
    assertThat(download.content()[0]).isEqualTo((byte) 9);
    file.setContent(null);
    assertThat(mapper.toDownload(file).content()).isNull();
  }

  private AchievementResponse achievement(UUID id, int total) {
    return new AchievementResponse(id, UUID.randomUUID(), "Student", "Title", null,
        AchievementCategory.OLYMPIC_SCHOOL, AchievementAward.NONE, false, LocalDate.of(2024, 1, 2),
        true, AchievementStatus.APPROVED, total, 0, total, null, null, created, updated, 1, List.of());
  }

  private record Rank(long rank, UUID userId, String fullName, String username, long totalPoints, long approvedCount)
      implements AchievementRepository.RankingProjection {
    @Override public long getRank() { return rank; }
    @Override public UUID getUserId() { return userId; }
    @Override public String getFullName() { return fullName; }
    @Override public String getUsername() { return username; }
    @Override public long getTotalPoints() { return totalPoints; }
    @Override public long getApprovedCount() { return approvedCount; }
  }

  private record FileMetadata(UUID id, String originalName, String contentType, long size, int position)
      implements RecognitionFileRepository.Metadata {
    @Override public UUID getId() { return id; }
    @Override public String getOriginalName() { return originalName; }
    @Override public String getContentType() { return contentType; }
    @Override public long getSize() { return size; }
    @Override public int getPosition() { return position; }
  }
}
