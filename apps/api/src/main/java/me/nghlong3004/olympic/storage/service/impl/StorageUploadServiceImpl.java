package me.nghlong3004.olympic.storage.service.impl;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.mapper.FileMapper;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.response.StorageUploadResponse;
import me.nghlong3004.olympic.storage.service.StorageCompensation;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.storage.service.StorageUploadService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/14/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StorageUploadServiceImpl implements StorageUploadService {
  private final StorageService storageService;
  private final FileRepository fileRepository;
  private final FileMapper fileMapper;
  private final StorageCompensation compensation;

  @Transactional
  @Override
  public StorageUploadResponse upload(MultipartFile file, StorageFolder folder) {
    var uploaded = storageService.upload(file, folder);
    compensation.onRollback(List.of(uploaded.storageKey()));
    var persisted = fileRepository.save(fileMapper.toEntity(uploaded, folder));
    var url = storageService.getDownloadUri(persisted.getStorageKey()).toString();
    return new StorageUploadResponse(persisted.getId(), url);
  }
}
