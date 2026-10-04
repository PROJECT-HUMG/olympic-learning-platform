package me.nghlong3004.olympic.question.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Arrays;
import javax.imageio.ImageIO;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
class QuestionFigurePolicyTest {
  private final QuestionFigurePolicy policy = new QuestionFigurePolicy();

  @Test
  void acceptsPngJpegAndCompleteWebpHeader() throws Exception {
    assertThat(policy.read(file("plot.png", "image/png", png())).contentType()).isEqualTo("image/png");
    assertThat(policy.read(file("plot.jpg", "application/octet-stream", jpeg())).contentType()).isEqualTo("image/jpeg");
    assertThat(policy.read(file("plot.webp", "image/webp", lossyWebp(1, 1))).contentType()).isEqualTo("image/webp");
    assertThat(policy.read(file("extended.webp", "image/webp", extendedWebp(0, 0))).contentType()).isEqualTo("image/webp");
  }

  @Test
  void rejectsForeignHugeAndTruncatedOrUnsupportedWebp() throws Exception {
    assertThatThrownBy(() -> policy.read(file("x.svg", "image/svg+xml", "<svg xmlns='http://www.w3.org/2000/svg'/>".getBytes())))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.FILE_TYPE_NOT_ALLOWED);
    assertThatThrownBy(() -> policy.read(file("huge.png", "image/png", hugePng())))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.FILE_TOO_LARGE);
    assertThatThrownBy(() -> policy.read(file("huge.webp", "image/webp", extendedWebp(8000, 0, 8001, 1))))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.FILE_TOO_LARGE);
    byte[] complete = lossyWebp(1, 1);
    assertThatThrownBy(() -> policy.read(file("cut.webp", "image/webp", Arrays.copyOf(complete, 18))))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.FILE_TYPE_NOT_ALLOWED);
    assertThatThrownBy(() -> policy.read(file("short-riff.webp", "image/webp", webpHeader(0, 0, 80))))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.FILE_TYPE_NOT_ALLOWED);
    assertThatThrownBy(() -> policy.read(file("anim.webp", "image/webp", animHeader())))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.FILE_TYPE_NOT_ALLOWED);
    assertThatThrownBy(() -> policy.read(file("vp8x.webp", "image/webp", webpHeader(0, 0, 22))))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.FILE_TYPE_NOT_ALLOWED);
    byte[] trailing = Arrays.copyOf(complete, complete.length + 1);
    assertThatThrownBy(() -> policy.read(file("trail.webp", "image/webp", trailing)))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.FILE_TYPE_NOT_ALLOWED);
  }

  @Test
  void rejectsWebpCanvasThatDisagreesWithPixelHeader() {
    assertThatThrownBy(() -> policy.read(file("mismatch.webp", "image/webp", extendedWebp(0, 0, 2, 1))))
        .isInstanceOf(ApiException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.FILE_TYPE_NOT_ALLOWED);
  }

  private static MockMultipartFile file(String name, String type, byte[] bytes) {
    return new MockMultipartFile("file", name, type, bytes);
  }

  private static byte[] png() throws IOException {
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    ImageIO.write(new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB), "png", out);
    return out.toByteArray();
  }

  private static byte[] jpeg() throws IOException {
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    ImageIO.write(new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB), "jpg", out);
    return out.toByteArray();
  }

  private static byte[] hugePng() {
    byte[] bytes = new byte[24];
    byte[] signature = new byte[] {(byte) 0x89, 'P', 'N', 'G', 13, 10, 26, 10};
    System.arraycopy(signature, 0, bytes, 0, signature.length);
    bytes[12] = 'I';
    bytes[13] = 'H';
    bytes[14] = 'D';
    bytes[15] = 'R';
    bytes[18] = 0x4e;
    bytes[19] = 0x20;
    bytes[23] = 1;
    return bytes;
  }

  private static byte[] webpHeader(int widthMinusOne, int heightMinusOne, int riffSize) {
    return new byte[] {
      'R', 'I', 'F', 'F',
      (byte) riffSize, (byte) (riffSize >>> 8), (byte) (riffSize >>> 16), (byte) (riffSize >>> 24),
      'W', 'E', 'B', 'P',
      'V', 'P', '8', 'X',
      10, 0, 0, 0,
      0, 0, 0, 0,
      (byte) widthMinusOne, (byte) (widthMinusOne >>> 8), (byte) (widthMinusOne >>> 16),
      (byte) heightMinusOne, (byte) (heightMinusOne >>> 8), (byte) (heightMinusOne >>> 16)
    };
  }

  private static byte[] lossyWebp(int width, int height) {
    int riffSize = 22;
    byte[] bytes = new byte[8 + riffSize];
    bytes[0] = 'R';
    bytes[1] = 'I';
    bytes[2] = 'F';
    bytes[3] = 'F';
    bytes[4] = (byte) riffSize;
    bytes[8] = 'W';
    bytes[9] = 'E';
    bytes[10] = 'B';
    bytes[11] = 'P';
    bytes[12] = 'V';
    bytes[13] = 'P';
    bytes[14] = '8';
    bytes[15] = ' ';
    bytes[16] = 10;
    bytes[23] = (byte) 0x9d;
    bytes[24] = 1;
    bytes[25] = 0x2a;
    bytes[26] = (byte) width;
    bytes[27] = (byte) (width >>> 8);
    bytes[28] = (byte) height;
    bytes[29] = (byte) (height >>> 8);
    return bytes;
  }

  private static byte[] extendedWebp(int widthMinusOne, int heightMinusOne) {
    return extendedWebp(widthMinusOne, heightMinusOne, widthMinusOne + 1, heightMinusOne + 1);
  }

  private static byte[] extendedWebp(
      int widthMinusOne, int heightMinusOne, int pixelWidth, int pixelHeight) {
    byte[] image = lossyWebp(pixelWidth, pixelHeight);
    int riffSize = 40;
    byte[] bytes = new byte[8 + riffSize];
    bytes[0] = 'R';
    bytes[1] = 'I';
    bytes[2] = 'F';
    bytes[3] = 'F';
    bytes[4] = (byte) riffSize;
    bytes[8] = 'W';
    bytes[9] = 'E';
    bytes[10] = 'B';
    bytes[11] = 'P';
    bytes[12] = 'V';
    bytes[13] = 'P';
    bytes[14] = '8';
    bytes[15] = 'X';
    bytes[16] = 10;
    bytes[24] = (byte) widthMinusOne;
    bytes[25] = (byte) (widthMinusOne >>> 8);
    bytes[26] = (byte) (widthMinusOne >>> 16);
    bytes[27] = (byte) heightMinusOne;
    bytes[28] = (byte) (heightMinusOne >>> 8);
    bytes[29] = (byte) (heightMinusOne >>> 16);
    System.arraycopy(image, 12, bytes, 30, 18);
    return bytes;
  }

  private static byte[] animHeader() {
    return new byte[] {
      'R', 'I', 'F', 'F', 12, 0, 0, 0, 'W', 'E', 'B', 'P', 'A', 'N', 'I', 'M', 0, 0, 0, 0
    };
  }
}
