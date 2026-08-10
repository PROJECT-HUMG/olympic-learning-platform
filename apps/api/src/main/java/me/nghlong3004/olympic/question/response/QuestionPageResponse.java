package me.nghlong3004.olympic.question.response;

import org.springframework.data.domain.Page;

/** @author nghlong3004 (Long Nguyen Hoang) @since 8/10/2026 */
public record QuestionPageResponse(java.util.List<QuestionResponse> content, int page, int size, long totalElements, int totalPages) {
  public static QuestionPageResponse from(Page<QuestionResponse> page) {
    return new QuestionPageResponse(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
  }
}
