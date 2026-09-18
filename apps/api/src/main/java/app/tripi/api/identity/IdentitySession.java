package app.tripi.api.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "identity_sessions")
class IdentitySession {

  @Id private UUID id;

  @Column(nullable = false, name = "account_id")
  private UUID accountId;

  @Column(nullable = false, name = "client_installation_id")
  private String clientInstallationId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SessionPlatform platform;

  @Column(name = "app_version")
  private String appVersion;

  @Column(name = "device_name")
  private String deviceName;

  @Column(nullable = false, name = "created_at")
  private Instant createdAt;

  @Column(nullable = false, name = "last_activity_at")
  private Instant lastActivityAt;

  @Column(nullable = false, name = "inactivity_expires_at")
  private Instant inactivityExpiresAt;

  @Column(nullable = false, name = "absolute_expires_at")
  private Instant absoluteExpiresAt;

  @Column(name = "revoked_at")
  private Instant revokedAt;

  @Column(name = "revoked_reason")
  private String revokedReason;

  @Version private long version;

  protected IdentitySession() {}

  IdentitySession(
      UUID id,
      UUID accountId,
      String clientInstallationId,
      SessionPlatform platform,
      String appVersion,
      String deviceName,
      Instant now,
      Instant inactivityExpiresAt,
      Instant absoluteExpiresAt) {
    this.id = id;
    this.accountId = accountId;
    this.clientInstallationId = clientInstallationId;
    this.platform = platform;
    this.appVersion = appVersion;
    this.deviceName = deviceName;
    this.createdAt = now;
    this.lastActivityAt = now;
    this.inactivityExpiresAt = inactivityExpiresAt;
    this.absoluteExpiresAt = absoluteExpiresAt;
  }

  UUID id() {
    return id;
  }

  UUID accountId() {
    return accountId;
  }

  SessionPlatform platform() {
    return platform;
  }

  String appVersion() {
    return appVersion;
  }

  String deviceName() {
    return deviceName;
  }

  Instant lastActivityAt() {
    return lastActivityAt;
  }

  boolean isActive(Instant now) {
    return revokedAt == null && now.isBefore(inactivityExpiresAt) && now.isBefore(absoluteExpiresAt);
  }

  void touch(Instant now, Instant inactivityExpiresAt) {
    this.lastActivityAt = now;
    this.inactivityExpiresAt = inactivityExpiresAt.isBefore(absoluteExpiresAt) ? inactivityExpiresAt : absoluteExpiresAt;
  }

  void revoke(Instant now, String reason) {
    if (revokedAt == null) {
      revokedAt = now;
      revokedReason = reason;
    }
  }
}
