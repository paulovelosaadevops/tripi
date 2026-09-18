package app.tripi.api.identity;

import java.util.Set;
import org.springframework.stereotype.Component;

@Component
class LegalConsentProperties {

  private static final Set<String> SUPPORTED_LOCALES = Set.of("pt-BR", "en-US");
  private static final String TERMS_VERSION = "terms-v0.1";
  private static final String PRIVACY_VERSION = "privacy-v0.1";

  boolean isSupportedLocale(String locale) {
    return SUPPORTED_LOCALES.contains(locale);
  }

  boolean isActiveTermsVersion(String version) {
    return TERMS_VERSION.equals(version);
  }

  boolean isActivePrivacyVersion(String version) {
    return PRIVACY_VERSION.equals(version);
  }

  String termsVersion() {
    return TERMS_VERSION;
  }

  String privacyVersion() {
    return PRIVACY_VERSION;
  }
}
