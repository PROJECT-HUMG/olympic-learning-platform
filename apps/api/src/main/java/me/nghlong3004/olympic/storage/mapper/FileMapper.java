package me.nghlong3004.olympic.storage.mapper;

import me.nghlong3004.olympic.storage.dto.UploadedFile;
import me.nghlong3004.olympic.storage.entity.File;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;

/**
 * @author nghlong3004
 */
@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface FileMapper {

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "folder", source = "folder")
  File toEntity(UploadedFile uploadedFile, StorageFolder folder);
}
