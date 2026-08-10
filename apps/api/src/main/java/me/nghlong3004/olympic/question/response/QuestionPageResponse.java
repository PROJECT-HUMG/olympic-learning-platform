package me.nghlong3004.olympic.question.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import org.springframework.data.domain.Page;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public record QuestionPageResponse(
    @Schema(description = "Questions in the current page") List<QuestionResponse> content,
    @Schema(example = "0") int page,
    @Schema(example = "20") int size,
    @Schema(example = "42") long totalElements,
    @Schema(example = "3") int totalPages) {
  public static QuestionPageResponse from(Page<QuestionResponse> page) {
    return new QuestionPageResponse(
        page.getContent(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages());
  }
}
