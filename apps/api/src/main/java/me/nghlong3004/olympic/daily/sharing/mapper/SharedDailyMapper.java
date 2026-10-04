package me.nghlong3004.olympic.daily.sharing.mapper;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.daily.response.DailyPlanResponse;
import me.nghlong3004.olympic.daily.sharing.enums.DailyShareAccess;
import me.nghlong3004.olympic.daily.sharing.response.SharedDailyDashboardResponse;
import me.nghlong3004.olympic.daily.sharing.response.SharedDailyMemberResponse;
import me.nghlong3004.olympic.daily.sharing.response.SharedDailySummaryResponse;
import me.nghlong3004.olympic.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * Callers decide visibility and resolve private plans before constructing these projections.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/04/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SharedDailyMapper {
  @Mapping(target = "planId", source = "id")
  SharedDailySummaryResponse toSummary(DailyPlanResponse plan);

  default SharedDailyMemberResponse toMember(
      User user, DailyShareAccess access, SharedDailySummaryResponse summary) {
    var name = user.getFullName() == null || user.getFullName().isBlank()
        ? user.getUsername() : user.getFullName();
    return new SharedDailyMemberResponse(user.getId(), name, access, summary);
  }

  default SharedDailyDashboardResponse toDashboard(
      UUID groupId, LocalDate date, List<SharedDailyMemberResponse> members) {
    return new SharedDailyDashboardResponse(groupId, date, members);
  }
}
