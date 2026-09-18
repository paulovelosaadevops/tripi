package app.tripi.api.identity;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
class TokenProperties {

  private final String issuer;
  private final String audience;
  private final String keyId;
  private final String privateKey;
  private final String publicKey;
  private final boolean allowEphemeralKeys;

  TokenProperties(
      @Value("${tripi.identity.tokens.issuer}") String issuer,
      @Value("${tripi.identity.tokens.audience}") String audience,
      @Value("${tripi.identity.tokens.key-id}") String keyId,
      @Value("${tripi.identity.tokens.private-key}") String privateKey,
      @Value("${tripi.identity.tokens.public-key}") String publicKey,
      @Value("${tripi.identity.tokens.allow-ephemeral-keys:false}") boolean allowEphemeralKeys) {
    this.issuer = issuer;
    this.audience = audience;
    this.keyId = keyId;
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.allowEphemeralKeys = allowEphemeralKeys;
  }

  String issuer() {
    return issuer;
  }

  String audience() {
    return audience;
  }

  String keyId() {
    return keyId;
  }

  String privateKey() {
    return privateKey;
  }

  String publicKey() {
    return publicKey;
  }

  boolean allowEphemeralKeys() {
    return allowEphemeralKeys;
  }

  Duration accessTokenTtl() {
    return Duration.ofMinutes(15);
  }

  Duration clockSkew() {
    return Duration.ofSeconds(60);
  }

  Duration sessionInactivityTtl() {
    return Duration.ofDays(30);
  }

  Duration sessionAbsoluteTtl() {
    return Duration.ofDays(90);
  }
}
