package app.tripi.api.identity;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
class AccessTokenService {

  private final JwtEncoder jwtEncoder;
  private final TokenProperties properties;
  private final Clock clock;

  AccessTokenService(JwtEncoder jwtEncoder, TokenProperties properties, Clock clock) {
    this.jwtEncoder = jwtEncoder;
    this.properties = properties;
    this.clock = clock;
  }

  IssuedAccessToken issue(Account account, IdentitySession session) {
    Instant now = clock.instant();
    Instant expiresAt = now.plus(properties.accessTokenTtl());
    JwtClaimsSet claims =
        JwtClaimsSet.builder()
            .issuer(properties.issuer())
            .audience(List.of(properties.audience()))
            .issuedAt(now)
            .notBefore(now)
            .expiresAt(expiresAt)
            .id(UUID.randomUUID().toString())
            .subject(account.id().toString())
            .claim("sid", session.id().toString())
            .claim("email_verified", account.isEmailVerified())
            .build();
    JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).keyId(properties.keyId()).build();
    String value = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    return new IssuedAccessToken(value, expiresAt);
  }
}
