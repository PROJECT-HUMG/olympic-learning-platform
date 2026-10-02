package me.nghlong3004.olympic.user.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import me.nghlong3004.olympic.user.request.UpdateAvatarCropRequest;
import me.nghlong3004.olympic.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
class AvatarCropControllerTest {
  private UserService service;
  private MockMvc mvc;

  @BeforeEach
  void setUp() {
    service = mock(UserService.class);
    mvc = MockMvcBuilders.standaloneSetup(new UserController(service)).build();
  }

  @Test
  void acceptsOriginalFileAndJsonMetadataAndKeepsLegacyUploads() throws Exception {
    var image = new MockMultipartFile("avatar", "portrait.jpg", "image/jpeg", new byte[] {1, 2, 3});
    var crop = new MockMultipartFile("crop", "crop.json", "application/json",
        "{\"x\":0.2,\"y\":0.8,\"zoom\":2}".getBytes(StandardCharsets.UTF_8));
    mvc.perform(multipart("/api/v1/users/me/avatar").file(image).file(crop)
        .with(request -> { request.setMethod("PUT"); return request; })).andExpect(status().isOk());
    verify(service).updateAvatar(any(), eq(new UpdateAvatarCropRequest(.2, .8, 2.0)));
    mvc.perform(multipart("/api/v1/users/me/avatar").file(image)
        .with(request -> { request.setMethod("PUT"); return request; })).andExpect(status().isOk());
    verify(service).updateAvatar(any(), isNull());
  }

  @Test
  void rejectsMissingOutOfRangeAndNonFiniteMetadata() throws Exception {
    for (String body : new String[] {"{}", "{\"x\":-0.1,\"y\":0.5,\"zoom\":1}",
        "{\"x\":0.5,\"y\":1.1,\"zoom\":1}", "{\"x\":0.5,\"y\":0.5,\"zoom\":0.9}",
        "{\"x\":0.5,\"y\":0.5,\"zoom\":3.1}", "{\"x\":\"NaN\",\"y\":0.5,\"zoom\":1}"}) {
      mvc.perform(patch("/api/v1/users/me/avatar/crop").contentType("application/json").content(body))
          .andExpect(status().isBadRequest());
    }
    verifyNoInteractions(service);
  }

  @Test
  void updatesFramingWithoutAnImageAndValidatesMultipartCrop() throws Exception {
    mvc.perform(patch("/api/v1/users/me/avatar/crop").contentType("application/json")
        .content("{\"x\":0,\"y\":1,\"zoom\":3}")).andExpect(status().isOk());
    verify(service).updateAvatarCrop(new UpdateAvatarCropRequest(0.0, 1.0, 3.0));
    var image = new MockMultipartFile("avatar", "portrait.png", "image/png", new byte[] {1});
    var crop = new MockMultipartFile("crop", "crop.json", "application/json",
        "{\"x\":0.5,\"y\":0.5,\"zoom\":0}".getBytes(StandardCharsets.UTF_8));
    mvc.perform(multipart("/api/v1/users/me/avatar").file(image).file(crop)
        .with(request -> { request.setMethod("PUT"); return request; })).andExpect(status().isBadRequest());
  }
}
