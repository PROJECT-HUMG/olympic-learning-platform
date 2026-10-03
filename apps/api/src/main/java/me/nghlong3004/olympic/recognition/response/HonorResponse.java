package me.nghlong3004.olympic.recognition.response;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import me.nghlong3004.olympic.recognition.enums.HonorScope;
import me.nghlong3004.olympic.recognition.enums.HonorStatus;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
public record HonorResponse(UUID id, String title, String subject, int year, String description,
    HonorScope scope, HonorStatus status, List<HonorParticipantResponse> participants,
    List<RecognitionFileResponse> photos, OffsetDateTime createdAt, OffsetDateTime updatedAt, long version) {}
