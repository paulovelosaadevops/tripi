package app.tripi.api.identity;

import java.util.List;

public class InvalidRegistrationRequest extends RuntimeException {

  private final List<ApiFieldViolation> violations;

  private InvalidRegistrationRequest(List<ApiFieldViolation> violations) {
    super("Registration request is invalid.");
    this.violations = List.copyOf(violations);
  }

  static InvalidRegistrationRequest validation(String field, String code, String message) {
    return new InvalidRegistrationRequest(List.of(new ApiFieldViolation(field, code, message)));
  }

  static InvalidRegistrationRequest validation(List<ApiFieldViolation> violations) {
    return new InvalidRegistrationRequest(violations);
  }

  public List<ApiFieldViolation> violations() {
    return violations;
  }
}
