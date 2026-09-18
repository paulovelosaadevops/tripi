package app.tripi.api.identity;

import org.springframework.stereotype.Component;

@Component
class PasswordPolicy {

  private static final int MIN_LENGTH = 12;
  private static final int MAX_LENGTH = 256;

  void validate(String password) {
    if (password == null || password.length() < MIN_LENGTH) {
      throw InvalidRegistrationRequest.validation(
          "password", "PASSWORD_POLICY_VIOLATION", "Password must have at least 12 characters.");
    }
    if (password.length() > MAX_LENGTH) {
      throw InvalidRegistrationRequest.validation(
          "password", "PASSWORD_POLICY_VIOLATION", "Password must have at most 256 characters.");
    }
  }
}
