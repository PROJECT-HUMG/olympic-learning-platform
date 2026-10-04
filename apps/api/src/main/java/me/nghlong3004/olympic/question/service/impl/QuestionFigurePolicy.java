package me.nghlong3004.olympic.question.service.impl;

import java.awt.Dimension;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * Magic-byte and bounded-dimension gate for private question rasters. JPEG and PNG dimensions are
 * confirmed from the image header. WebP must contain one VP8 or VP8L chunk, and the RIFF size must
 * end at the last file byte. A VP8X canvas must match that chunk's header, and both sizes are
 * bounds-checked. The pixel bitstream is not decoded.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/3/2026
 */
@Component
public class QuestionFigurePolicy {
  public static final int MAX_FIGURES = 20;
  public static final int MAX_BYTES = 5 * 1024 * 1024;
  public static final int MAX_EDGE = 8_000;
  public static final long MAX_PIXELS = 24_000_000L;

  public AcceptedFigure read(MultipartFile file) {
    if (file == null || file.isEmpty() || file.getSize() > MAX_BYTES) {
      throw ErrorCode.FILE_TOO_LARGE.throwIt("Figure must not exceed 5 MiB");
    }
    byte[] bytes = readBounded(file);
    if (bytes.length == 0 || bytes.length > MAX_BYTES || bytes.length != file.getSize()) {
      throw ErrorCode.FILE_TOO_LARGE.throwIt("Figure is empty, truncated, or too large");
    }
    String type = mediaType(bytes);
    if (type == null) {
      throw ErrorCode.FILE_TYPE_NOT_ALLOWED.throwIt("Figure must be JPEG, PNG, or WebP");
    }
    Dimension dimension = switch (type) {
      case "image/png" -> png(bytes);
      case "image/jpeg" -> jpeg(bytes);
      case "image/webp" -> webp(bytes);
      default -> null;
    };
    if (dimension == null) {
      throw ErrorCode.FILE_TYPE_NOT_ALLOWED.throwIt("Figure dimensions could not be read");
    }
    requireBounds(dimension);
    if (!"image/webp".equals(type)) {
      confirmWithReader(bytes, dimension);
    }
    return new AcceptedFigure(canonicalName(file.getOriginalFilename(), type), type, bytes);
  }

  private static byte[] readBounded(MultipartFile file) {
    try (var input = file.getInputStream()) {
      return input.readNBytes(MAX_BYTES + 1);
    } catch (IOException exception) {
      throw ErrorCode.FILE_UPLOAD_FAILED.throwIt();
    }
  }

  private static void requireBounds(Dimension dimension) {
    long pixels = (long) dimension.width * dimension.height;
    if (dimension.width < 1 || dimension.height < 1 || dimension.width > MAX_EDGE
        || dimension.height > MAX_EDGE || pixels > MAX_PIXELS) {
      throw ErrorCode.FILE_TOO_LARGE.throwIt("Figure dimensions are too large");
    }
  }

  private static void confirmWithReader(byte[] bytes, Dimension expected) {
    try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
      if (input == null) {
        throw ErrorCode.FILE_TYPE_NOT_ALLOWED.throwIt("Figure could not be decoded");
      }
      var readers = ImageIO.getImageReaders(input);
      if (!readers.hasNext()) {
        throw ErrorCode.FILE_TYPE_NOT_ALLOWED.throwIt("Figure could not be decoded");
      }
      ImageReader reader = readers.next();
      try {
        reader.setInput(input, true, true);
        int width = reader.getWidth(0);
        int height = reader.getHeight(0);
        if (width != expected.width || height != expected.height) {
          throw ErrorCode.FILE_TYPE_NOT_ALLOWED.throwIt("Figure dimensions are inconsistent");
        }
      } finally {
        reader.dispose();
      }
    } catch (ApiException exception) {
      throw exception;
    } catch (IOException exception) {
      throw ErrorCode.FILE_TYPE_NOT_ALLOWED.throwIt("Figure could not be decoded");
    }
  }

  private static String mediaType(byte[] bytes) {
    if (bytes.length >= 8 && bytes[0] == (byte) 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G'
        && bytes[4] == 13 && bytes[5] == 10 && bytes[6] == 26 && bytes[7] == 10) {
      return "image/png";
    }
    if (bytes.length >= 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff) {
      return "image/jpeg";
    }
    if (bytes.length >= 12 && ascii(bytes, 0, 4).equals("RIFF") && ascii(bytes, 8, 4).equals("WEBP")) {
      return "image/webp";
    }
    return null;
  }

  private static Dimension png(byte[] bytes) {
    if (bytes.length < 24 || !ascii(bytes, 12, 4).equals("IHDR")) {
      return null;
    }
    return new Dimension(intAt(bytes, 16), intAt(bytes, 20));
  }

  private static Dimension jpeg(byte[] bytes) {
    int index = 2;
    int markers = 0;
    while (index + 3 < bytes.length && markers++ < 200) {
      if ((bytes[index] & 0xff) != 0xff) {
        return null;
      }
      while (index < bytes.length && (bytes[index] & 0xff) == 0xff) {
        index++;
      }
      if (index >= bytes.length) {
        return null;
      }
      int marker = bytes[index++] & 0xff;
      if (marker == 0xd9 || marker == 0xda) {
        return null;
      }
      if (index + 1 >= bytes.length) {
        return null;
      }
      int length = ((bytes[index] & 0xff) << 8) | (bytes[index + 1] & 0xff);
      if (length < 2 || index + length > bytes.length) {
        return null;
      }
      if (marker >= 0xc0 && marker <= 0xcf && marker != 0xc4 && marker != 0xc8 && marker != 0xcc) {
        if (length < 7) {
          return null;
        }
        int height = ((bytes[index + 3] & 0xff) << 8) | (bytes[index + 4] & 0xff);
        int width = ((bytes[index + 5] & 0xff) << 8) | (bytes[index + 6] & 0xff);
        return new Dimension(width, height);
      }
      index += length;
    }
    return null;
  }

  private static Dimension webp(byte[] bytes) {
    if (bytes.length < 20) {
      reject("WebP header is truncated");
    }
    long riffSize = uint32(bytes, 4);
    long riffEnd = 8L + riffSize;
    if (riffSize < 12 || riffEnd != bytes.length) {
      reject("WebP header is truncated");
    }
    int offset = 12;
    Dimension canvas = null;
    Dimension pixels = null;
    int chunks = 0;
    while (offset < riffEnd) {
      if (chunks++ > 64 || riffEnd - offset < 8) {
        reject("WebP chunk is truncated");
      }
      String type = ascii(bytes, offset, 4);
      long size = uint32(bytes, offset + 4);
      long end = offset + 8L + size;
      long next = (size & 1L) == 1L ? end + 1 : end;
      if (end > riffEnd || next > riffEnd) {
        reject("WebP chunk is truncated");
      }
      if ("VP8X".equals(type)) {
        if (canvas != null || pixels != null) {
          reject("WebP chunk is unsupported");
        }
        canvas = chunkDimension(type, bytes, offset + 8, size);
      } else if ("VP8 ".equals(type) || "VP8L".equals(type)) {
        if (pixels != null) {
          reject("WebP chunk is unsupported");
        }
        pixels = chunkDimension(type, bytes, offset + 8, size);
      } else if (canvas == null) {
        reject("WebP chunk is unsupported");
      }
      offset = (int) next;
    }
    if (pixels == null) {
      reject("WebP chunk is unsupported");
    }
    if (canvas != null) {
      requireBounds(canvas);
      requireBounds(pixels);
      if (!canvas.equals(pixels)) {
        reject("WebP chunk is unsupported");
      }
    }
    return pixels;
  }

  private static Dimension chunkDimension(String type, byte[] bytes, int payload, long size) {
    if ("VP8X".equals(type)) {
      if (size < 10) {
        reject("WebP chunk is truncated");
      }
      return new Dimension(1 + uint24(bytes, payload + 4), 1 + uint24(bytes, payload + 7));
    }
    if ("VP8 ".equals(type)) {
      if (size < 10) {
        reject("WebP chunk is truncated");
      }
      if ((bytes[payload] & 1) != 0
          || bytes[payload + 3] != (byte) 0x9d
          || bytes[payload + 4] != 1
          || bytes[payload + 5] != 0x2a) {
        reject("WebP chunk is unsupported");
      }
      return new Dimension(uint16(bytes, payload + 6) & 0x3fff, uint16(bytes, payload + 8) & 0x3fff);
    }
    if ("VP8L".equals(type)) {
      if (size < 5 || bytes[payload] != 0x2f) {
        reject("WebP chunk is truncated");
      }
      long bits = uint32(bytes, payload + 1);
      return new Dimension((int) (bits & 0x3fff) + 1, (int) ((bits >> 14) & 0x3fff) + 1);
    }
    reject("WebP chunk is unsupported");
    return null;
  }

  private static void reject(String detail) {
    throw ErrorCode.FILE_TYPE_NOT_ALLOWED.throwIt(detail);
  }

  private static String canonicalName(String original, String type) {
    String name = original == null ? "figure" : original.replace('\\', '/');
    name = name.substring(name.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}]", "");
    if (name.isBlank()) {
      name = "figure";
    }
    String extension = switch (type) {
      case "image/jpeg" -> ".jpg";
      case "image/png" -> ".png";
      case "image/webp" -> ".webp";
      default -> "";
    };
    String lower = name.toLowerCase(Locale.ROOT);
    if (lower.endsWith(extension) || ("image/jpeg".equals(type) && lower.endsWith(".jpeg"))) {
      return name.substring(0, Math.min(name.length(), 200));
    }
    return name.substring(0, Math.min(name.length(), 200 - extension.length())) + extension;
  }

  private static String ascii(byte[] bytes, int offset, int length) {
    return new String(bytes, offset, length, StandardCharsets.US_ASCII);
  }

  private static int intAt(byte[] bytes, int offset) {
    return ((bytes[offset] & 0xff) << 24)
        | ((bytes[offset + 1] & 0xff) << 16)
        | ((bytes[offset + 2] & 0xff) << 8)
        | (bytes[offset + 3] & 0xff);
  }

  private static int uint16(byte[] bytes, int offset) {
    return (bytes[offset] & 0xff) | ((bytes[offset + 1] & 0xff) << 8);
  }

  private static int uint24(byte[] bytes, int offset) {
    return (bytes[offset] & 0xff) | ((bytes[offset + 1] & 0xff) << 8) | ((bytes[offset + 2] & 0xff) << 16);
  }

  private static long uint32(byte[] bytes, int offset) {
    return (bytes[offset] & 0xffL)
        | ((bytes[offset + 1] & 0xffL) << 8)
        | ((bytes[offset + 2] & 0xffL) << 16)
        | ((bytes[offset + 3] & 0xffL) << 24);
  }

  public record AcceptedFigure(String originalName, String contentType, byte[] content) {}
}
