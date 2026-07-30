package me.nghlong3004.olympic.auth.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import me.nghlong3004.olympic.common.properties.SecurityProperties;
import me.nghlong3004.olympic.user.entity.User;
import me.nghlong3004.olympic.user.enums.Permission;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;

@ExtendWith(MockitoExtension.class)
class JwtTokenServiceImplTest {

  @Mock private JwtEncoder jwtEncoder;
  @Mock private SecurityProperties properties;

  private JwtTokenServiceImpl jwtTokenService;

  @BeforeEach
  void setUp() {
    Clock clock = Clock.fixed(Instant.parse("2026-07-30T10:00:00Z"), ZoneId.of("UTC"));
    when(properties.accessExpirationMinutes()).thenReturn(15L);
    jwtTokenService = new JwtTokenServiceImpl(jwtEncoder, properties, clock);
  }

  @Test
  void issueAccessToken_shouldIncludeAllPermissions_whenUserIsAdmin() {
    User admin = User.builder()
        .id(UUID.randomUUID())
        .email("admin@test.com")
        .username("admin")
        .fullName("Admin User")
        .role(Role.ADMIN)
        .status(Status.ACTIVE)
        .build();

    Jwt mockJwt = mock(Jwt.class);
    when(mockJwt.getTokenValue()).thenReturn("mock-token");
    when(jwtEncoder.encode(any(JwtEncoderParameters.class))).thenReturn(mockJwt);

    String token = jwtTokenService.issueAccessToken(admin);

    assertThat(token).isEqualTo("mock-token");

    ArgumentCaptor<JwtEncoderParameters> captor = ArgumentCaptor.forClass(JwtEncoderParameters.class);
    verify(jwtEncoder).encode(captor.capture());

    JwtEncoderParameters params = captor.getValue();
    List<String> permissionsClaim = params.getClaims().getClaim("permissions");
    
    assertThat(permissionsClaim).containsExactlyInAnyOrderElementsOf(
        Arrays.stream(Permission.values()).map(Enum::name).toList());
  }

  @Test
  void issueAccessToken_shouldIncludeOnlyAssignedPermissions_whenUserIsStudent() {
    User student = User.builder()
        .id(UUID.randomUUID())
        .email("student@test.com")
        .username("student")
        .fullName("Student User")
        .role(Role.STUDENT)
        .status(Status.ACTIVE)
        .permissions(Set.of(Permission.DOCUMENT_UPLOAD))
        .build();

    Jwt mockJwt = mock(Jwt.class);
    when(mockJwt.getTokenValue()).thenReturn("mock-token");
    when(jwtEncoder.encode(any(JwtEncoderParameters.class))).thenReturn(mockJwt);

    String token = jwtTokenService.issueAccessToken(student);

    assertThat(token).isEqualTo("mock-token");

    ArgumentCaptor<JwtEncoderParameters> captor = ArgumentCaptor.forClass(JwtEncoderParameters.class);
    verify(jwtEncoder).encode(captor.capture());

    JwtEncoderParameters params = captor.getValue();
    List<String> permissionsClaim = params.getClaims().getClaim("permissions");
    
    assertThat(permissionsClaim).containsExactly("DOCUMENT_UPLOAD");
  }
}
