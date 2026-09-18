package app.tripi.api.identity;

import jakarta.transaction.Transactional;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
class RegistrationService {

  private static final Pattern BASIC_EMAIL_PATTERN =
      Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

  private final AccountRepository accounts;
  private final CredentialRepository credentials;
  private final UserProfileRepository profiles;
  private final ConsentAcceptanceRepository consents;
  private final PasswordEncoder passwordEncoder;
  private final PasswordPolicy passwordPolicy;
  private final EmailNormalizer emailNormalizer;
  private final LegalConsentProperties legalConsents;
  private final Clock clock;

  RegistrationService(
      AccountRepository accounts,
      CredentialRepository credentials,
      UserProfileRepository profiles,
      ConsentAcceptanceRepository consents,
      PasswordEncoder passwordEncoder,
      PasswordPolicy passwordPolicy,
      EmailNormalizer emailNormalizer,
      LegalConsentProperties legalConsents,
      Clock clock) {
    this.accounts = accounts;
    this.credentials = credentials;
    this.profiles = profiles;
    this.consents = consents;
    this.passwordEncoder = passwordEncoder;
    this.passwordPolicy = passwordPolicy;
    this.emailNormalizer = emailNormalizer;
    this.legalConsents = legalConsents;
    this.clock = clock;
  }

  @Transactional
  RegisterAccountResponse register(RegisterAccountRequest request) {
    validate(request);

    String normalizedEmail = emailNormalizer.normalize(request.email());
    if (accounts.existsByEmailNormalizedAndDeletedAtIsNull(normalizedEmail)) {
      throw new DuplicateAccountException();
    }

    Instant now = clock.instant();
    UUID accountId = UUID.randomUUID();
    Account account = new Account(accountId, request.email().trim(), normalizedEmail, now);
    String passwordHash = passwordEncoder.encode(request.password());

    try {
      accounts.save(account);
      credentials.save(new Credential(accountId, passwordHash, now));
      profiles.save(new UserProfile(accountId, request.name().trim(), request.locale(), now));
      consents.saveAll(
          List.of(
              new ConsentAcceptance(
                  UUID.randomUUID(),
                  accountId,
                  ConsentDocumentType.TERMS_OF_USE,
                  request.acceptedTermsVersion(),
                  request.locale(),
                  now,
                  "registration"),
              new ConsentAcceptance(
                  UUID.randomUUID(),
                  accountId,
                  ConsentDocumentType.PRIVACY_POLICY,
                  request.acceptedPrivacyVersion(),
                  request.locale(),
                  now,
                  "registration")));
      accounts.flush();
    } catch (DataIntegrityViolationException exception) {
      throw new DuplicateAccountException();
    }

    return RegisterAccountResponse.from(account, request);
  }

  private void validate(RegisterAccountRequest request) {
    List<ApiFieldViolation> violations = new ArrayList<>();
    String normalizedEmail = emailNormalizer.normalize(request.email());

    if (request.name() == null || request.name().trim().isEmpty()) {
      violations.add(new ApiFieldViolation("name", "REQUIRED", "Name is required."));
    }
    if (request.name() != null && request.name().trim().length() > 120) {
      violations.add(new ApiFieldViolation("name", "TOO_LONG", "Name is too long."));
    }
    if (request.email() == null || request.email().trim().isEmpty()) {
      violations.add(new ApiFieldViolation("email", "REQUIRED", "E-mail is required."));
    }
    if (normalizedEmail.length() > 254) {
      violations.add(new ApiFieldViolation("email", "TOO_LONG", "E-mail is too long."));
    }
    if (!BASIC_EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
      violations.add(new ApiFieldViolation("email", "INVALID_EMAIL", "E-mail is invalid."));
    }
    if (request.locale() == null || request.locale().isBlank()) {
      violations.add(new ApiFieldViolation("locale", "REQUIRED", "Locale is required."));
    }
    if (request.ageConfirmed() == null || !request.ageConfirmed()) {
      violations.add(
          new ApiFieldViolation("ageConfirmed", "AGE_RESTRICTED", "User must confirm being at least 18."));
    }
    if (!legalConsents.isSupportedLocale(request.locale())) {
      violations.add(new ApiFieldViolation("locale", "UNSUPPORTED_LOCALE", "Locale is not supported."));
    }
    if (!legalConsents.isActiveTermsVersion(request.acceptedTermsVersion())) {
      violations.add(
          new ApiFieldViolation(
              "acceptedTermsVersion", "INACTIVE_LEGAL_VERSION", "Terms version is not active."));
    }
    if (!legalConsents.isActivePrivacyVersion(request.acceptedPrivacyVersion())) {
      violations.add(
          new ApiFieldViolation(
              "acceptedPrivacyVersion",
              "INACTIVE_LEGAL_VERSION",
              "Privacy policy version is not active."));
    }
    if (!violations.isEmpty()) {
      throw InvalidRegistrationRequest.validation(violations);
    }

    passwordPolicy.validate(request.password());
  }
}
