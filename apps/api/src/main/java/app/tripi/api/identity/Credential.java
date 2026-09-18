package app.tripi.api.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "credentials")
class Credential {

  @Id
  @Column(name = "account_id")
  private UUID accountId;

  @Column(nullable = false, name = "password_hash")
  private String passwordHash;

  @Column(nullable = false, name = "password_changed_at")
  private Instant passwordChangedAt;

  @Column(nullable = false, name = "created_at")
  private Instant createdAt;

  protected Credential() {}

  Credential(UUID accountId, String passwordHash, Instant now) {
    this.accountId = accountId;
    this.passwordHash = passwordHash;
    this.passwordChangedAt = now;
    this.createdAt = now;
  }

  UUID accountId() {
    return accountId;
  }

  String passwordHash() {
    return passwordHash;
  }
}
