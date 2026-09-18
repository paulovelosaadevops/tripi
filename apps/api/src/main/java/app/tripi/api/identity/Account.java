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
@Table(name = "accounts")
class Account {

  @Id private UUID id;

  @Column(nullable = false)
  private String email;

  @Column(nullable = false, name = "email_normalized")
  private String emailNormalized;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AccountStatus status;

  @Column(nullable = false, name = "created_at")
  private Instant createdAt;

  @Column(nullable = false, name = "updated_at")
  private Instant updatedAt;

  @Column(name = "deleted_at")
  private Instant deletedAt;

  @Version private long version;

  protected Account() {}

  Account(UUID id, String email, String emailNormalized, Instant now) {
    this.id = id;
    this.email = email;
    this.emailNormalized = emailNormalized;
    this.status = AccountStatus.PENDING_EMAIL_VERIFICATION;
    this.createdAt = now;
    this.updatedAt = now;
  }

  UUID id() {
    return id;
  }

  String email() {
    return email;
  }

  String emailNormalized() {
    return emailNormalized;
  }

  AccountStatus status() {
    return status;
  }

  Instant createdAt() {
    return createdAt;
  }
}
