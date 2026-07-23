package me.nghlong3004.olympic.storage.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.storage.dto.UploadedFile;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.enums.StorageProvider;
import me.nghlong3004.olympic.storage.service.StorageService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Cloudinary-backed implementation of {@link StorageService}.
 *
 * <p>This service is purely infrastructural — it knows nothing about users, avatars, or any other
 * business domain. It accepts a raw {@link MultipartFile}, pushes it to Cloudinary, and returns
 * upload metadata.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/23/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "olympic.storage.provider", havingValue = "cloudinary")
public class CloudinaryStorageService implements StorageService {

  private final Cloudinary cloudinary;

  @Override
  public UploadedFile upload(MultipartFile file, StorageFolder folder) {
    var publicId = folder.getPath() + "/" + UUID.randomUUID();
    try {
      @SuppressWarnings("unchecked")
      Map<String, Object> result =
          cloudinary
              .uploader()
              .upload(
                  file.getBytes(),
                  ObjectUtils.asMap(
                      "public_id", publicId,
                      "resource_type", "auto",
                      "overwrite", false));

      var storageKey = (String) result.get("public_id");

      log.info("File uploaded to Cloudinary: storageKey={}, size={}", storageKey, file.getSize());

      return new UploadedFile(
          storageKey,
          file.getOriginalFilename(),
          file.getContentType(),
          file.getSize(),
          StorageProvider.CLOUDINARY);

    } catch (IOException e) {
      log.error("Cloudinary upload failed: folder={}", folder, e);
      throw ErrorCode.FILE_UPLOAD_FAILED.throwIt();
    }
  }

  @Override
  public void delete(String storageKey) {
    try {
      cloudinary.uploader().destroy(storageKey, ObjectUtils.emptyMap());
      log.info("File deleted from Cloudinary: storageKey={}", storageKey);
    } catch (IOException e) {
      log.error("Cloudinary delete failed: storageKey={}", storageKey, e);
    }
  }

  @Override
  public String getPublicUrl(String storageKey) {
    return cloudinary.url().generate(storageKey);
  }
}
