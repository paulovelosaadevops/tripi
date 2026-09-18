package app.tripi.api.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "consent_acceptances")
class ConsentAcceptance {

  @Id private UUID id;

  @Column(nullable = false, name = "account_id")
  private UUID accountId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, name = "document_type")
  private ConsentDocumentType documentType;

  @Column(nullable = false, name = "document_version")
  private String documentVersion;

  @Column(nullable = false)
  private String locale;

  @Column(nullable = false, name = "accepted_at")
  private Instant acceptedAt;

  @Column(nullable = false, name = "technical_context")
  private String technicalContext;

  protected ConsentAcceptance() {}

  ConsentAcceptance(
      UUID id,
      UUID accountId,
      ConsentDocumentType documentType,
      String documentVersion,
      String locale,
      Instant acceptedAt,
      String technicalContext) {
    this.id = id;
    this.accountId = accountId;
    this.documentType = documentType;
    this.documentVersion = documentVersion;
    this.locale = locale;
    this.acceptedAt = acceptedAt;
    this.technicalContext = technicalContext;
  }
}
