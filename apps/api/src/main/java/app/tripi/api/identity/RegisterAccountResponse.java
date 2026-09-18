package app.tripi.api.identity;

import java.time.Instant;
import java.util.UUID;

record RegisterAccountResponse(
    UUID id,
    String email,
    String name,
    String status,
    String locale,
    String acceptedTermsVersion,
    String acceptedPrivacyVersion,
    Instant createdAt) {

  static RegisterAccountResponse from(Account account, RegisterAccountRequest request) {
    return new RegisterAccountResponse(
        account.id(),
        account.email(),
        request.name().trim(),
        account.status().name(),
        request.locale(),
        request.acceptedTermsVersion(),
        request.acceptedPrivacyVersion(),
        account.createdAt());
  }

  @Override
  public String toString() {
    return "RegisterAccountResponse["
        + "id="
        + id
        + ", email=<redacted>"
        + ", name=<redacted>"
        + ", status="
        + status
        + ", locale="
        + locale
        + ", acceptedTermsVersion="
        + acceptedTermsVersion
        + ", acceptedPrivacyVersion="
        + acceptedPrivacyVersion
        + ", createdAt="
        + createdAt
        + "]";
  }
}
