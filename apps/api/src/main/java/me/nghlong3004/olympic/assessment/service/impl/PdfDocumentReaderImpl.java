package me.nghlong3004.olympic.assessment.service.impl;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import me.nghlong3004.olympic.assessment.dto.AssessmentPage;
import me.nghlong3004.olympic.assessment.service.PdfDocumentReader;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

/**
 * PDFBox implementation that preserves a rendered page image for vision parsing and review.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
@Slf4j
@Service
public class PdfDocumentReaderImpl implements PdfDocumentReader {

  private static final float RENDER_DPI = 220;

  @Override
  public List<AssessmentPage> read(byte[] content) {
    try (PDDocument document = Loader.loadPDF(content)) {
      var renderer = new PDFRenderer(document);
      var pages = new ArrayList<AssessmentPage>(document.getNumberOfPages());
      for (int index = 0; index < document.getNumberOfPages(); index++) {
        var image = renderer.renderImageWithDPI(index, RENDER_DPI, ImageType.RGB);
        var output = new ByteArrayOutputStream();
        javax.imageio.ImageIO.write(image, "png", output);
        var stripper = new PDFTextStripper();
        stripper.setStartPage(index + 1);
        stripper.setEndPage(index + 1);
        pages.add(new AssessmentPage(index + 1, output.toByteArray(), image.getWidth(), image.getHeight(), stripper.getText(document)));
      }
      return pages;
    } catch (IOException exception) {
      log.warn("Unable to parse uploaded PDF: reason={}", exception.getMessage());
      throw new IllegalArgumentException("The uploaded file is not a readable PDF", exception);
    }
  }
}
