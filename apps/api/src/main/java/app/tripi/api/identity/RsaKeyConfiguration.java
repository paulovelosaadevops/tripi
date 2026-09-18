package app.tripi.api.identity;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.proc.SecurityContext;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@Configuration
class RsaKeyConfiguration {

  @Bean
  RSAKey rsaKey(TokenProperties properties) {
    if (properties.privateKey().isBlank() || properties.publicKey().isBlank()) {
      if (!properties.allowEphemeralKeys()) {
        throw new IllegalStateException("JWT RSA keys must be configured outside test environments.");
      }
      return ephemeralKey(properties.keyId());
    }
    RSAPrivateKey privateKey = privateKey(properties.privateKey());
    RSAPublicKey publicKey = publicKey(properties.publicKey());
    return new RSAKey.Builder(publicKey).privateKey(privateKey).keyID(properties.keyId()).build();
  }

  @Bean
  JwtEncoder jwtEncoder(RSAKey rsaKey) {
    return new NimbusJwtEncoder(new ImmutableJWKSet<SecurityContext>(new JWKSet(rsaKey)));
  }

  @Bean
  JwtDecoder jwtDecoder(RSAKey rsaKey, TokenProperties properties) throws Exception {
    NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey()).build();
    OAuth2TokenValidator<org.springframework.security.oauth2.jwt.Jwt> validator =
        new DelegatingOAuth2TokenValidator<>(
            JwtValidators.createDefaultWithIssuer(properties.issuer()),
            new JwtTimestampValidator(properties.clockSkew()),
            token -> token.getAudience().contains(properties.audience())
                ? org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.success()
                : org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.failure(
                    new org.springframework.security.oauth2.core.OAuth2Error(
                        "invalid_token", "Invalid token audience.", null)));
    decoder.setJwtValidator(validator);
    return decoder;
  }

  private RSAKey ephemeralKey(String keyId) {
    try {
      KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
      generator.initialize(2048);
      KeyPair keyPair = generator.generateKeyPair();
      return new RSAKey.Builder((RSAPublicKey) keyPair.getPublic())
          .privateKey((RSAPrivateKey) keyPair.getPrivate())
          .keyID(keyId)
          .build();
    } catch (Exception exception) {
      throw new IllegalStateException("Could not generate test RSA key.", exception);
    }
  }

  private RSAPrivateKey privateKey(String value) {
    try {
      byte[] bytes = decodePem(value, "PRIVATE KEY");
      return (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(bytes));
    } catch (Exception exception) {
      throw new IllegalStateException("Invalid JWT private key configuration.", exception);
    }
  }

  private RSAPublicKey publicKey(String value) {
    try {
      byte[] bytes = decodePem(value, "PUBLIC KEY");
      return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(bytes));
    } catch (Exception exception) {
      throw new IllegalStateException("Invalid JWT public key configuration.", exception);
    }
  }

  private byte[] decodePem(String value, String label) {
    String normalized =
        value
            .replace("-----BEGIN " + label + "-----", "")
            .replace("-----END " + label + "-----", "")
            .replace("\\n", "")
            .replaceAll("\\s", "");
    return Base64.getDecoder().decode(normalized);
  }
}
