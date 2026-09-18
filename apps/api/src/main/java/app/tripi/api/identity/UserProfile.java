package app.tripi.api.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
class UserProfile {

  @Id
  @Column(name = "account_id")
  private UUID accountId;

  @Column(nullable = false, name = "display_name")
  private String displayName;

  @Column(nullable = false, name = "birthdate_confirmed")
  private boolean birthdateConfirmed;

  @Column(nullable = false, name = "support_email_locale")
  private String supportEmailLocale;

  @Column(nullable = false, name = "created_at")
  private Instant createdAt;

  @Column(nullable = false, name = "updated_at")
  private Instant updatedAt;

  protected UserProfile() {}

  UserProfile(UUID accountId, String displayName, String supportEmailLocale, Instant now) {
    this.accountId = accountId;
    this.displayName = displayName;
    this.birthdateConfirmed = true;
    this.supportEmailLocale = supportEmailLocale;
    this.createdAt = now;
    this.updatedAt = now;
  }

  String displayName() {
    return displayName;
  }

  String supportEmailLocale() {
    return supportEmailLocale;
  }
}
