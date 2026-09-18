package app.tripi.api.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
class RefreshTokenRecord {

  @Id private UUID id;

  @Column(nullable = false, name = "family_id")
  private UUID familyId;

  @Column(nullable = false, name = "session_id")
  private UUID sessionId;

  @Column(nullable = false, name = "token_hash")
  private String tokenHash;

  @Column(nullable = false, name = "issued_at")
  private Instant issuedAt;

  @Column(nullable = false, name = "expires_at")
  private Instant expiresAt;

  @Column(name = "consumed_at")
  private Instant consumedAt;

  @Column(name = "revoked_at")
  private Instant revokedAt;

  @Column(name = "reuse_detected_at")
  private Instant reuseDetectedAt;

  @Column(name = "replaced_by_token_id")
  private UUID replacedByTokenId;

  protected RefreshTokenRecord() {}

  RefreshTokenRecord(UUID id, UUID familyId, UUID sessionId, String tokenHash, Instant now, Instant expiresAt) {
    this.id = id;
    this.familyId = familyId;
    this.sessionId = sessionId;
    this.tokenHash = tokenHash;
    this.issuedAt = now;
    this.expiresAt = expiresAt;
  }

  UUID id() {
    return id;
  }

  UUID familyId() {
    return familyId;
  }

  UUID sessionId() {
    return sessionId;
  }

  String tokenHash() {
    return tokenHash;
  }

  boolean isUsable(Instant now) {
    return consumedAt == null && revokedAt == null && reuseDetectedAt == null && now.isBefore(expiresAt);
  }

  boolean wasAlreadyUsed() {
    return consumedAt != null || reuseDetectedAt != null;
  }

  void consume(Instant now, UUID replacementId) {
    consumedAt = now;
    replacedByTokenId = replacementId;
  }

  void revoke(Instant now) {
    if (revokedAt == null) {
      revokedAt = now;
    }
  }

  void detectReuse(Instant now) {
    reuseDetectedAt = now;
  }
}
