package me.nghlong3004.olympic.api.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * JWT configuration using NimbusJwtEncoder/Decoder with HS256 (HmacSHA256).
 *
 * <p>Secret key is loaded from {@code olympic.security.jwt.secret-key} environment variable.
 * Uses {@link ImmutableSecret} for thread-safe, immutable key material.
 *
 * @author nghlong3004
 * @since 2026-06-05
 */
@Configuration
public class JwtConfig {

    @Value("${olympic.security.jwt.secret-key}")
    private String secret;

    @Bean
    public SecretKey secretKey() {
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey secretKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(secretKey));
    }

    @Bean
    public JwtDecoder jwtDecoder(SecretKey secretKey) {
        return NimbusJwtDecoder.withSecretKey(secretKey)
                .build();
    }
}
