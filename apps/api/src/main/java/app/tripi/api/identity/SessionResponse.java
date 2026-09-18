package app.tripi.api.identity;

import java.time.Instant;
import java.util.UUID;

record SessionResponse(
    UUID id,
    SessionPlatform platform,
    String appVersion,
    String deviceName,
    boolean current,
    Instant lastSeenAt,
    Instant inactivityExpiresAt,
    Instant absoluteExpiresAt,
    boolean revoked) {

  static SessionResponse from(IdentitySession session, UUID currentSessionId, Instant now) {
    return new SessionResponse(
        session.id(),
        session.platform(),
        session.appVersion(),
        session.deviceName(),
        session.id().equals(currentSessionId),
        session.lastActivityAt(),
        null,
        null,
        !session.isActive(now));
  }
}
