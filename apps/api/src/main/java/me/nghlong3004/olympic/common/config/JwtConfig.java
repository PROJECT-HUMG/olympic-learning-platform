package me.nghlong3004.olympic.common.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 7/15/2026
 */
@Configuration
public class JwtConfig {

  private static final String ISSUER = "olympic";
  public static final String EMAIL_CLAIM = "email";
  public static final String USERNAME_CLAIM = "username";
  public static final String FULL_NAME_CLAIM = "full-name";
  public static final String ROLE_CLAIM = "role";
  public static final String STATUS_CLAIM = "status";

  @Bean
  public JwtEncoder jwtEncoder(SecurityProperties properties) {
    return new NimbusJwtEncoder(new ImmutableSecret<>(jwtKey(properties)));
  }

  @Bean
  public JwtDecoder jwtDecoder(SecurityProperties properties) {
    var decoder =
        NimbusJwtDecoder.withSecretKey(jwtKey(properties)).macAlgorithm(MacAlgorithm.HS256).build();

    decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(ISSUER));

    return decoder;
  }

  private SecretKeySpec jwtKey(SecurityProperties properties) {
    var secret = properties.jwt().secretKey();

    if (secret == null || secret.isBlank() || secret.startsWith("${")) {
      throw new IllegalStateException("olympic.security.jwt.secret-key must be configured");
    }

    var keyBytes = secret.getBytes(StandardCharsets.UTF_8);

    if (keyBytes.length < 32) {
      throw new IllegalStateException(
          "olympic.security.jwt.secret-key must contain at least 32 UTF-8 bytes");
    }

    return new SecretKeySpec(keyBytes, "HmacSHA256");
  }
}
