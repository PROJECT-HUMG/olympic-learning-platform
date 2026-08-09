package me.nghlong3004.olympic.assessment.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 8/10/2026
 */
class PdfDocumentReaderImplTest {

  @Test
  void readsRenderedPagesAndTextLayer() throws Exception {
    try (var document = new PDDocument()) {
      var page = new PDPage();
      document.addPage(page);
      try (var stream = new PDPageContentStream(document, page)) {
        stream.beginText();
        stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
        stream.newLineAtOffset(72, 700);
        stream.showText("Cau 1. Tinh gia tri x");
        stream.endText();
      }
      var bytes = new ByteArrayOutputStream();
      document.save(bytes);

      var result = new PdfDocumentReaderImpl().read(bytes.toByteArray());

      assertThat(result).hasSize(1);
      assertThat(result.getFirst().pageNumber()).isEqualTo(1);
      assertThat(result.getFirst().image()).isNotEmpty();
      assertThat(result.getFirst().text()).contains("Cau 1");
      assertThat(result.getFirst().width()).isGreaterThan(0);
      assertThat(result.getFirst().height()).isGreaterThan(0);
    }
  }
}
