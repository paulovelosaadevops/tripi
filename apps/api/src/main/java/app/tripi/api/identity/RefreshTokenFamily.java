package app.tripi.api.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_token_families")
class RefreshTokenFamily {

  @Id private UUID id;

  @Column(nullable = false, name = "session_id")
  private UUID sessionId;

  @Column(nullable = false, name = "account_id")
  private UUID accountId;

  @Column(nullable = false, name = "created_at")
  private Instant createdAt;

  @Column(name = "revoked_at")
  private Instant revokedAt;

  @Column(name = "revoked_reason")
  private String revokedReason;

  @Column(name = "reuse_detected_at")
  private Instant reuseDetectedAt;

  protected RefreshTokenFamily() {}

  RefreshTokenFamily(UUID id, UUID sessionId, UUID accountId, Instant now) {
    this.id = id;
    this.sessionId = sessionId;
    this.accountId = accountId;
    this.createdAt = now;
  }

  UUID id() {
    return id;
  }

  UUID sessionId() {
    return sessionId;
  }

  UUID accountId() {
    return accountId;
  }

  boolean isActive() {
    return revokedAt == null;
  }

  void revoke(Instant now, String reason) {
    if (revokedAt == null) {
      revokedAt = now;
      revokedReason = reason;
    }
  }

  void detectReuse(Instant now) {
    reuseDetectedAt = now;
    revoke(now, "REFRESH_TOKEN_REUSE");
  }
}
