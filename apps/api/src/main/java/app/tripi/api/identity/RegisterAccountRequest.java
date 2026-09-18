package app.tripi.api.identity;

record RegisterAccountRequest(
    String name,
    String email,
    String password,
    String locale,
    Boolean ageConfirmed,
    String acceptedTermsVersion,
    String acceptedPrivacyVersion) {

  @Override
  public String toString() {
    return "RegisterAccountRequest["
        + "name="
        + name
        + ", email=<redacted>"
        + ", password=<redacted>"
        + ", locale="
        + locale
        + ", ageConfirmed="
        + ageConfirmed
        + ", acceptedTermsVersion="
        + acceptedTermsVersion
        + ", acceptedPrivacyVersion="
        + acceptedPrivacyVersion
        + "]";
  }
}
