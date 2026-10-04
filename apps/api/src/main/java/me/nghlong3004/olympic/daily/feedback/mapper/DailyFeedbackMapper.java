package me.nghlong3004.olympic.daily.feedback.mapper;

import java.util.List;
import me.nghlong3004.olympic.daily.feedback.entity.DailyFeedback;
import me.nghlong3004.olympic.daily.feedback.response.DailyFeedbackContributionResponse;
import me.nghlong3004.olympic.daily.feedback.response.DailyFeedbackResponse;
import me.nghlong3004.olympic.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

/**
 * Structural feedback projection; author resolution and permitted contribution selection stay in services.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/04/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface DailyFeedbackMapper {
  default DailyFeedbackContributionResponse toContribution(DailyFeedback row, User author) {
    var name = author.getFullName() == null || author.getFullName().isBlank()
        ? author.getUsername() : author.getFullName();
    return new DailyFeedbackContributionResponse(
        row.getId(), row.getAuthorId(), name, row.getText(), row.getCreatedAt(), row.getUpdatedAt(),
        row.getVersion());
  }

  default DailyFeedbackResponse toResponse(List<DailyFeedbackContributionResponse> rows, int count) {
    return new DailyFeedbackResponse(rows, count);
  }
}
