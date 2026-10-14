package me.nghlong3004.olympic.storage.service;

import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.response.StorageUploadResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/14/2026
 */
public interface StorageUploadService {
  /**
   * Uploads and persists file metadata, compensating known transaction rollback. Folder
   * authorization remains with the existing HTTP method-security contract.
   *
   * @param file uploaded file
   * @param folder existing logical destination
   * @return persisted identity and resolved download URL
   */
  StorageUploadResponse upload(MultipartFile file, StorageFolder folder);
}
