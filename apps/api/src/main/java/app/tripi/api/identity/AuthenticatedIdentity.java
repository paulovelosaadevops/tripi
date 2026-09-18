package app.tripi.api.identity;

import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

record AuthenticatedIdentity(UUID accountId, UUID sessionId) {

  static AuthenticatedIdentity from(Authentication authentication) {
    if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
      throw AuthenticationException.authenticationRequired();
    }
    return new AuthenticatedIdentity(UUID.fromString(jwt.getSubject()), UUID.fromString(jwt.getClaimAsString("sid")));
  }
}
