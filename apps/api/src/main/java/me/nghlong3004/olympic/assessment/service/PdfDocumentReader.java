package me.nghlong3004.olympic.assessment.service;

import java.util.List;
import me.nghlong3004.olympic.assessment.dto.AssessmentPage;

/**
 * Reads and renders uploaded assessment PDFs for downstream parsing.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
public interface PdfDocumentReader {

  /**
   * Renders each PDF page and extracts its text layer when available.
   *
   * @param content PDF bytes
   * @return rendered pages in document order
   */
  List<AssessmentPage> read(byte[] content);
}
