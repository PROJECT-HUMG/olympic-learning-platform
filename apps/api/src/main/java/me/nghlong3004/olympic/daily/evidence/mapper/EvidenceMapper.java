package me.nghlong3004.olympic.daily.evidence.mapper;

import me.nghlong3004.olympic.daily.evidence.dto.EvidenceDownload;
import me.nghlong3004.olympic.daily.evidence.entity.DailyEvidence;
import me.nghlong3004.olympic.daily.evidence.response.EvidenceMetadataResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * Structural metadata and defensive byte projection after service authorization and kind checks.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/04/2026
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface EvidenceMapper {
  @Mapping(target = "planId", source = "task.plan.id")
  @Mapping(target = "taskId", source = "task.id")
  EvidenceMetadataResponse toMetadata(DailyEvidence row);

  default EvidenceDownload toDownload(DailyEvidence row) {
    return new EvidenceDownload(row.getOriginalName(), row.getContent().clone());
  }
}
