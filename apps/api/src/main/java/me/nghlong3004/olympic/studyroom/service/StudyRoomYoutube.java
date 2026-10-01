package me.nghlong3004.olympic.studyroom.service;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/01/2026
 */
public final class StudyRoomYoutube {
  private static final Set<String> HOSTS = Set.of("youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be");
  private static final Pattern VIDEO_ID = Pattern.compile("[A-Za-z0-9_-]{11}");

  private StudyRoomYoutube() {}

  /** Extracts an allowlisted video ID without fetching a user-supplied URL or metadata. */
  public static String videoId(String value) {
    try {
      if (value == null || value.length() > 2048) throw invalid();
      URI uri = new URI(value.trim());
      if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
          || !HOSTS.contains(uri.getHost().toLowerCase(Locale.ROOT))
          || uri.getUserInfo() != null || (uri.getPort() != -1 && uri.getPort() != 443)) throw invalid();
      String path = uri.getRawPath();
      String id;
      if ("youtu.be".equalsIgnoreCase(uri.getHost())) {
        id = path.startsWith("/") ? path.substring(1) : "";
      } else if ("/watch".equals(path)) {
        if (uri.getRawQuery() == null) throw invalid();
        List<String> ids = Arrays.stream(uri.getRawQuery().split("&"))
            .filter(part -> part.startsWith("v=")).map(part -> part.substring(2)).toList();
        if (ids.size() != 1) throw invalid();
        id = ids.getFirst();
      } else if (path.startsWith("/embed/") || path.startsWith("/live/") || path.startsWith("/v/")) {
        id = path.substring(path.lastIndexOf('/') + 1);
        if (!path.equals("/embed/" + id) && !path.equals("/live/" + id) && !path.equals("/v/" + id)) throw invalid();
      } else {
        throw invalid();
      }
      if (!VIDEO_ID.matcher(id).matches()) throw invalid();
      return id;
    } catch (URISyntaxException exception) {
      throw invalid();
    }
  }

  private static ApiException invalid() {
    return ErrorCode.STUDY_ROOM_INVALID_REQUEST.throwIt("Dùng liên kết HTTPS của một video YouTube cụ thể.");
  }
}
