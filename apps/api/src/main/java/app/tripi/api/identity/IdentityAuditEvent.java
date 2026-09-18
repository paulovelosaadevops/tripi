package app.tripi.api.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "identity_audit_events")
class IdentityAuditEvent {

  @Id private UUID id;

  @Column(name = "account_id")
  private UUID accountId;

  @Column(name = "session_id")
  private UUID sessionId;

  @Column(nullable = false, name = "event_type")
  private String eventType;

  @Column(nullable = false, name = "occurred_at")
  private Instant occurredAt;

  @Column(nullable = false)
  private String metadata;

  protected IdentityAuditEvent() {}

  IdentityAuditEvent(UUID accountId, UUID sessionId, String eventType, Instant occurredAt, String metadata) {
    this.id = UUID.randomUUID();
    this.accountId = accountId;
    this.sessionId = sessionId;
    this.eventType = eventType;
    this.occurredAt = occurredAt;
    this.metadata = metadata;
  }
}
