package me.nghlong3004.olympic.document.mapper;

import me.nghlong3004.olympic.document.entity.DocumentCategory;
import me.nghlong3004.olympic.document.response.CategorySummaryResponse;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CategoryMapper {
  CategorySummaryResponse toSummaryResponse(DocumentCategory category);
}
