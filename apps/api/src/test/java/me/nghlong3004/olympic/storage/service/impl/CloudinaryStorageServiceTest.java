package me.nghlong3004.olympic.storage.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.junit.jupiter.api.Test;

/**
 * Offline URL contract checks; no provider calls or account configuration.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/10/2026
 */
class CloudinaryStorageServiceTest {
  private final CloudinaryStorageService storage = new CloudinaryStorageService(
      new Cloudinary(ObjectUtils.asMap("cloud_name", "synthetic", "secure", true)));

  @Test
  void documentPdfUsesFirstPagePublicImageDeliveryWithoutSigningOrCropping() {
    String publicId = "documents/00000000-0000-0000-0000-000000000001";
    var uri = storage.getThumbnailUri(publicId + ".pdf");
    String url = uri.toString();
    assertThat(url).startsWith("https://res.cloudinary.com/synthetic/image/upload/")
        .contains("pg_1", "w_600", "h_800", "c_limit")
        .doesNotContain("private", "authenticated", "s--", "token", ".pdf.jpg");
    assertThat(uri.getPath()).endsWith(publicId + ".jpg");
  }

  @Test
  void unknownOrNonDocumentKeysDoNotGainAPreview() {
    for (String key : new String[] {"", "documents/legacy.pdf", "documents/a/raw.pdf",
        "documents/00000000-0000-0000-0000-000000000001.docx",
        "assessment-sources/00000000-0000-0000-0000-000000000001.pdf",
        "private/documents/00000000-0000-0000-0000-000000000001.pdf",
        "https://example.invalid/private.pdf?token=synthetic"}) {
      assertThat(storage.getThumbnailUri(key)).as(key).isNull();
    }
    assertThat(storage.getThumbnailUri(null)).isNull();
  }
}
