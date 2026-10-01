package me.nghlong3004.olympic.studyroom.response;

import java.util.UUID;
import me.nghlong3004.olympic.studyroom.enums.StudyRoomRequestPolicy;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
public record StudyRoomSummaryResponse(
    UUID id, String name, UUID ownerId, String ownerName, long activeMembers,
    int focusMinutes, int breakMinutes, int longBreakMinutes,
    StudyRoomRequestPolicy requestPolicy, int minimumStudyMinutes) {}
