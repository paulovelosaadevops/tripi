package app.tripi.api.identity;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
class InternalCredentialVerifier {

  private final AccountRepository accounts;
  private final CredentialRepository credentials;
  private final EmailNormalizer emailNormalizer;
  private final PasswordEncoder passwordEncoder;

  InternalCredentialVerifier(
      AccountRepository accounts,
      CredentialRepository credentials,
      EmailNormalizer emailNormalizer,
      PasswordEncoder passwordEncoder) {
    this.accounts = accounts;
    this.credentials = credentials;
    this.emailNormalizer = emailNormalizer;
    this.passwordEncoder = passwordEncoder;
  }

  boolean matches(String email, String rawPassword) {
    String normalizedEmail = emailNormalizer.normalize(email);
    return accounts
        .findByEmailNormalizedAndDeletedAtIsNull(normalizedEmail)
        .flatMap(account -> credentials.findByAccountId(account.id()))
        .map(credential -> passwordEncoder.matches(rawPassword, credential.passwordHash()))
        .orElseGet(() -> passwordEncoder.matches(rawPassword == null ? "" : rawPassword, neutralHash()));
  }

  private String neutralHash() {
    return "$argon2id$v=19$m=19456,t=2,p=1$MTIzNDU2Nzg5MDEyMzQ1Ng$u9aonh8y07FT7WNqow5p9LfqLDxyl1pwQei0yLdBYwQ";
  }
}
