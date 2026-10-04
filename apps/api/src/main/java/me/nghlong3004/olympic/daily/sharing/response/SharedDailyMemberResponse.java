package me.nghlong3004.olympic.daily.sharing.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.UUID;
import me.nghlong3004.olympic.daily.sharing.enums.DailyShareAccess;

/**
 * One active member on the selected day. A hidden row keeps identity and a null summary.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@JsonInclude(JsonInclude.Include.ALWAYS)
public record SharedDailyMemberResponse(
    UUID userId, String displayName, DailyShareAccess access, SharedDailySummaryResponse summary) {}
