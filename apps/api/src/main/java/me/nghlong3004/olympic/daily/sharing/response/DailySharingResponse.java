package me.nghlong3004.olympic.daily.sharing.response;

import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.daily.sharing.request.SaveDailySharingRequest.Audience;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/16/2026
 */
public record DailySharingResponse(UUID planId, long version, List<Audience> audiences) {}
