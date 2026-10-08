package me.nghlong3004.olympic.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import jakarta.persistence.EntityManager;
import java.net.URI;
import me.nghlong3004.olympic.common.properties.UserProperties;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.storage.entity.File;
import me.nghlong3004.olympic.storage.enums.StorageFolder;
import me.nghlong3004.olympic.storage.enums.StorageProvider;
import me.nghlong3004.olympic.storage.mapper.FileMapper;
import me.nghlong3004.olympic.storage.repository.FileRepository;
import me.nghlong3004.olympic.storage.service.StorageService;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.mapper.UserMapper;
import me.nghlong3004.olympic.user.repository.UserRepository;
import me.nghlong3004.olympic.user.request.UpdateAvatarCropRequest;
import me.nghlong3004.olympic.user.service.UserService;
import me.nghlong3004.olympic.user.service.impl.UserServiceImpl;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/2/2026
 */
@DataJpaTest(properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true"}, showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({UserServiceImpl.class, AvatarCropIntegrationTest.Dependencies.class})
@Testcontainers(disabledWithoutDocker = true)
class AvatarCropIntegrationTest {
  @Container @ServiceConnection
  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");
  @Autowired private UserService service;
  @Autowired private UserRepository users;
  @Autowired private FileRepository files;
  @Autowired private EntityManager entityManager;
  @MockitoBean private CurrentUserProvider current;
  @MockitoBean private StorageService storage;

  @Test
  void persistsFramingIndependentlyOfOriginalFileAndReturnsItAfterReload() {
    var original = files.save(File.builder().storageKey("avatar/original.png").originalName("original.png")
        .contentType("image/png").size(4321L).provider(StorageProvider.CLOUDINARY).folder(StorageFolder.AVATAR).build());
    var user = users.save(User.builder().username("crop-user").email("crop-user@test.invalid").avatar(original).build());
    when(current.getCurrentUser()).thenReturn(CurrentUser.builder().id(user.getId()).build());
    when(storage.getDownloadUri(original.getStorageKey())).thenReturn(URI.create("https://images.test/original.png"));
    var originalId = original.getId();

    service.updateAvatarCrop(new UpdateAvatarCropRequest(.2, .8, 2.0));
    entityManager.flush();
    entityManager.clear();

    var saved = users.findById(user.getId()).orElseThrow();
    assertThat(saved.getAvatar().getId()).isEqualTo(originalId);
    assertThat(saved.getAvatar().getSize()).isEqualTo(4321L);
    assertThat(saved.getAvatar().getOriginalName()).isEqualTo("original.png");
    var response = service.me();
    assertThat(response.avatarUrl()).isEqualTo("https://images.test/original.png");
    assertThat(response.avatarCrop().x()).isEqualTo(.2);
    assertThat(response.avatarCrop().y()).isEqualTo(.8);
    assertThat(response.avatarCrop().zoom()).isEqualTo(2);

    service.removeAvatar();
    entityManager.flush();
    entityManager.clear();
    assertThat(service.me().avatarCrop()).isNull();
    assertThat(files.findById(originalId)).isEmpty();
  }

  @Test
  void leavesLegacyAvatarFramingAbsent() {
    var user = users.save(User.builder().username("legacy-user").email("legacy-user@test.invalid").build());
    when(current.getCurrentUser()).thenReturn(CurrentUser.builder().id(user.getId()).build());
    entityManager.flush();
    entityManager.clear();
    assertThat(service.me().avatarCrop()).isNull();
  }

  @TestConfiguration
  static class Dependencies {
    @Bean UserMapper userMapper() { return Mappers.getMapper(UserMapper.class); }
    @Bean FileMapper fileMapper() { return Mappers.getMapper(FileMapper.class); }
    @Bean UserProperties userProperties() { return new UserProperties(null); }
  }
}
