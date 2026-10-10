package me.nghlong3004.olympic.recognition.mapper;

import java.util.List;
import me.nghlong3004.olympic.recognition.dto.AchievementMappingSource;
import me.nghlong3004.olympic.recognition.dto.RecognitionDownload;
import me.nghlong3004.olympic.recognition.entity.Honor;
import me.nghlong3004.olympic.recognition.entity.HonorParticipant;
import me.nghlong3004.olympic.recognition.entity.RecognitionFile;
import me.nghlong3004.olympic.recognition.repository.AchievementRepository;
import me.nghlong3004.olympic.recognition.repository.RecognitionFileRepository;
import me.nghlong3004.olympic.recognition.response.AchievementResponse;
import me.nghlong3004.olympic.recognition.response.HonorParticipantResponse;
import me.nghlong3004.olympic.recognition.response.HonorResponse;
import me.nghlong3004.olympic.recognition.response.RankingResponse;
import me.nghlong3004.olympic.recognition.response.RecognitionFileResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * Structural recognition responses. Callers authorize evidence, mask privileged fields, resolve
 * storage URLs, and apply the points policy before these methods run.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface RecognitionMapper {

  default HonorParticipantResponse toParticipant(HonorParticipant participant) {
    return new HonorParticipantResponse(participant.getUserId(), participant.getFullName(), participant.getAward(), null, null, false);
  }

  default List<HonorParticipantResponse> toParticipants(List<HonorParticipant> participants) {
    return participants.stream().map(this::toParticipant).toList();
  }

  @Mapping(target = "id", source = "honor.id")
  @Mapping(target = "title", source = "honor.title")
  @Mapping(target = "subject", source = "honor.subject")
  @Mapping(target = "year", source = "honor.year")
  @Mapping(target = "description", source = "honor.description")
  @Mapping(target = "scope", source = "honor.scope")
  @Mapping(target = "status", source = "honor.status")
  @Mapping(target = "participants", expression = "java(mappedParticipants)")
  @Mapping(target = "photos", expression = "java(photos)")
  @Mapping(target = "createdAt", source = "honor.createdAt")
  @Mapping(target = "updatedAt", source = "honor.updatedAt")
  @Mapping(target = "version", source = "honor.version")
  HonorResponse toHonor(
      Honor honor, List<HonorParticipantResponse> mappedParticipants, List<RecognitionFileResponse> photos);

  @Mapping(target = "id", source = "achievement.id")
  @Mapping(target = "userId", source = "achievement.userId")
  @Mapping(target = "fullName", source = "fullName")
  @Mapping(target = "title", source = "achievement.title")
  @Mapping(target = "description", source = "achievement.description")
  @Mapping(target = "category", source = "achievement.category")
  @Mapping(target = "award", source = "achievement.award")
  @Mapping(target = "includeParticipation", source = "achievement.includeParticipation")
  @Mapping(target = "achievedDate", source = "achievement.achievedDate")
  @Mapping(target = "publicVisible", source = "achievement.publicVisible")
  @Mapping(target = "status", source = "achievement.status")
  @Mapping(target = "awardPoints", source = "achievement.awardPoints")
  @Mapping(target = "participationPoints", source = "achievement.participationPoints")
  @Mapping(target = "totalPoints", source = "totalPoints")
  @Mapping(target = "reviewNote", source = "reviewNote")
  @Mapping(target = "reviewedAt", source = "reviewedAt")
  @Mapping(target = "createdAt", source = "achievement.createdAt")
  @Mapping(target = "updatedAt", source = "achievement.updatedAt")
  @Mapping(target = "version", source = "achievement.version")
  @Mapping(target = "evidence", expression = "java(source.evidence())")
  AchievementResponse toAchievement(AchievementMappingSource source);

  RankingResponse toRanking(AchievementRepository.RankingProjection row);

  default RecognitionFileResponse toFile(RecognitionFileRepository.Metadata metadata, String url) {
    return new RecognitionFileResponse(
        metadata.getId(), metadata.getOriginalName(), metadata.getContentType(), metadata.getSize(), url);
  }

  @Mapping(target = "content", expression = "java(file.getContent())")
  RecognitionDownload toDownload(RecognitionFile file);
}
