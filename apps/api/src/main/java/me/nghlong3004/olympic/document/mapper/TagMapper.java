package me.nghlong3004.olympic.document.mapper;

import me.nghlong3004.olympic.document.entity.Tag;
import me.nghlong3004.olympic.document.response.TagSummaryResponse;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/26/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TagMapper {
  TagSummaryResponse toSummaryResponse(Tag tag);
}
