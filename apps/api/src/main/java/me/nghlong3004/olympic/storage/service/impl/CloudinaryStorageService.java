package me.nghlong3004.olympic.storage.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
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
    try {
      return upload(file.getBytes(), file.getOriginalFilename(), file.getContentType(), folder);
    } catch (Exception e) {
      log.error("Cloudinary upload failed: folder={}", folder, e);
      throw ErrorCode.FILE_UPLOAD_FAILED.throwIt();
    }
  }

  @Override
  public UploadedFile upload(byte[] content, String originalName, String contentType, StorageFolder folder) {
    var publicIdRaw = folder.getPath() + "/" + UUID.randomUUID();
    try {
      Map<?, ?> result =
          cloudinary
              .uploader()
              .upload(
                  content,
                  ObjectUtils.asMap(
                      "public_id", publicIdRaw, "resource_type", "auto", "overwrite", false));

      var publicId = (String) result.get("public_id");
      var format = (String) result.get("format");
      var storageKey = format != null ? publicId + "." + format : publicId;

      log.info("File uploaded to Cloudinary: storageKey={}, size={}", storageKey, content.length);

      return new UploadedFile(
          storageKey,
          originalName,
          contentType,
          content.length,
          StorageProvider.CLOUDINARY,
          folder);

    } catch (Exception e) {
      log.error("Cloudinary upload failed: folder={}", folder, e);
      throw ErrorCode.FILE_UPLOAD_FAILED.throwIt();
    }
  }

  private String extractPublicId(String storageKey) {
    int lastDot = storageKey.lastIndexOf(".");
    if (lastDot > 0 && lastDot > storageKey.lastIndexOf("/")) {
      return storageKey.substring(0, lastDot);
    }
    return storageKey;
  }

  @Override
  public void delete(String storageKey) {
    try {
      String publicId = extractPublicId(storageKey);
      cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
      log.info("File deleted from Cloudinary: storageKey={}, publicId={}", storageKey, publicId);
    } catch (IOException e) {
      log.error("Cloudinary delete failed: storageKey={}", storageKey, e);
    }
  }

  @Override
  public URI getDownloadUri(String storageKey) {
    return URI.create(cloudinary.url().secure(true).generate(storageKey));
  }

  @Override
  public URI getThumbnailUri(String storageKey) {
    // Legacy keys do not retain resource_type/access metadata. Only attempt the existing
    // unsigned public image/upload namespace; never guess raw/private/authenticated delivery.
    if (storageKey == null || !storageKey.matches(
        "documents/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\.pdf")) {
      return null;
    }
    String publicId = extractPublicId(storageKey);
    String url =
        cloudinary
            .url()
            .resourceType("image")
            .type("upload")
            .signed(false)
            .transformation(new Transformation<>().page(1).width(600).height(800).crop("limit"))
            .format("jpg")
            .secure(true)
            .generate(publicId);

    return URI.create(url);
  }

  @Override
  public byte[] download(String storageKey) {
    try (InputStream inputStream = getDownloadUri(storageKey).toURL().openStream()) {
      return inputStream.readAllBytes();
    } catch (IOException exception) {
      log.error("Cloudinary download failed: storageKey={}", storageKey, exception);
      throw ErrorCode.FILE_NOT_FOUND.throwIt();
    }
  }
}
