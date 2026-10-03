package me.nghlong3004.olympic.recognition.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.recognition.entity.RecognitionFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * Validates bounded files by their binary signature, never trusting browser MIME metadata.
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/02/2026
 */
@Component
public class RecognitionUploadPolicy {
  private final long maxFileBytes;
  private final long maxBatchBytes;
  private final int maxEvidence;
  private final int maxPhotos;

  public RecognitionUploadPolicy(
      @Value("${olympic.recognition.max-file-bytes:5242880}") long maxFileBytes,
      @Value("${olympic.recognition.max-batch-bytes:15728640}") long maxBatchBytes,
      @Value("${olympic.recognition.max-evidence:3}") int maxEvidence,
      @Value("${olympic.recognition.max-photos:10}") int maxPhotos) {
    // Schema-enforced hard limits may be tightened by operators, never silently exceeded.
    if (maxFileBytes < 1 || maxFileBytes > 5L * 1024 * 1024 || maxBatchBytes < 1
        || maxBatchBytes > 15L * 1024 * 1024 || maxEvidence < 1 || maxEvidence > 3 || maxPhotos < 1 || maxPhotos > 10) {
      throw new IllegalArgumentException("Recognition upload limits exceed supported bounds");
    }
    this.maxFileBytes = maxFileBytes;
    this.maxBatchBytes = maxBatchBytes;
    this.maxEvidence = maxEvidence;
    this.maxPhotos = maxPhotos;
  }

  /**
   * Reads bounded uploads and derives their media type from the actual content.
   *
   * @param files multipart evidence or photos
   * @param evidence whether PDF proof is permitted
   * @param existingPhotos current album size, used to prevent concurrent gallery overflow
   * @return validated unsaved files with a safe filename matching the detected media type
   */
  public List<RecognitionFile> validate(List<MultipartFile> files, boolean evidence, int existingPhotos) {
    int limit = evidence ? maxEvidence : maxPhotos - existingPhotos;
    if (files == null || files.isEmpty() || files.size() > limit) {
      throw ErrorCode.VALIDATION_ERROR.throwIt(evidence ? "Provide 1 to " + maxEvidence + " evidence files" : "Album supports at most " + maxPhotos + " photos");
    }
    long total = 0;
    for (var file : files) {
      if (file == null || file.isEmpty()) throw ErrorCode.VALIDATION_ERROR.throwIt("File is empty");
      if (file.getSize() > maxFileBytes) throw ErrorCode.FILE_TOO_LARGE.throwIt("Each file must not exceed " + maxFileBytes + " bytes");
      total += file.getSize();
    }
    if (total > maxBatchBytes) throw ErrorCode.FILE_TOO_LARGE.throwIt("Upload batch must not exceed " + maxBatchBytes + " bytes");
    return files.stream().map(file -> read(file, evidence)).toList();
  }

  private RecognitionFile read(MultipartFile file, boolean evidence) {
    byte[] bytes;
    try (var input = file.getInputStream()) {
      bytes = input.readNBytes((int) maxFileBytes + 1);
    } catch (IOException exception) {
      throw ErrorCode.FILE_UPLOAD_FAILED.throwIt();
    }
    if (bytes.length == 0 || bytes.length > maxFileBytes || bytes.length != file.getSize()) {
      throw ErrorCode.FILE_TOO_LARGE.throwIt("File is empty, truncated or too large");
    }
    var type = contentType(bytes);
    if (type == null || (!evidence && type.equals("application/pdf"))) {
      throw ErrorCode.FILE_TYPE_NOT_ALLOWED.throwIt(evidence ? "Evidence must be JPEG, PNG, WebP or PDF" : "Photo must be JPEG, PNG or WebP");
    }
    var name = file.getOriginalFilename();
    if (name == null || name.isBlank()) name = "attachment";
    name = name.replace('\\', '/');
    name = name.substring(name.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}]", "");
    if (name.isBlank()) name = "attachment";
    name = canonicalName(name, type);
    return RecognitionFile.builder().originalName(name).contentType(type).size(bytes.length).content(bytes).build();
  }

  private String canonicalName(String name, String type) {
    var extension = switch (type) {
      case "image/jpeg" -> ".jpg";
      case "image/png" -> ".png";
      case "image/webp" -> ".webp";
      case "application/pdf" -> ".pdf";
      default -> throw ErrorCode.FILE_TYPE_NOT_ALLOWED.throwIt();
    };
    var lowerName = name.toLowerCase(Locale.ROOT);
    if (lowerName.endsWith(extension) || (type.equals("image/jpeg") && lowerName.endsWith(".jpeg"))) {
      var suffix = name.substring(name.lastIndexOf('.'));
      return name.substring(0, Math.min(name.length() - suffix.length(), 200 - suffix.length())) + suffix;
    }
    // Keep the original display basename, but never offer HTML/SVG as the saved file extension.
    return name.substring(0, Math.min(name.length(), 200 - extension.length())) + extension;
  }

  private String contentType(byte[] b) {
    if (b.length >= 8 && b[0] == (byte) 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
        && b[4] == 13 && b[5] == 10 && b[6] == 26 && b[7] == 10) return "image/png";
    if (b.length >= 3 && b[0] == (byte) 0xff && b[1] == (byte) 0xd8 && b[2] == (byte) 0xff) return "image/jpeg";
    if (b.length >= 12 && ascii(b, 0, 4).equals("RIFF") && ascii(b, 8, 4).equals("WEBP")) return "image/webp";
    if (b.length >= 5 && ascii(b, 0, 5).equals("%PDF-")) return "application/pdf";
    return null;
  }

  private String ascii(byte[] bytes, int offset, int length) {
    return new String(bytes, offset, length, StandardCharsets.US_ASCII);
  }
}
