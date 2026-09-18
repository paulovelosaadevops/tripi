package app.tripi.api.identity;

import org.springframework.http.HttpStatus;

public class AuthenticationException extends RuntimeException {

  private final HttpStatus status;
  private final String code;

  AuthenticationException(HttpStatus status, String code, String message) {
    super(message);
    this.status = status;
    this.code = code;
  }

  public HttpStatus status() {
    return status;
  }

  public String code() {
    return code;
  }

  static AuthenticationException invalidCredentials() {
    return new AuthenticationException(
        HttpStatus.UNAUTHORIZED, "AUTHENTICATION_FAILED", "Authentication failed.");
  }

  static AuthenticationException emailVerificationRequired() {
    return new AuthenticationException(
        HttpStatus.UNAUTHORIZED, "EMAIL_VERIFICATION_REQUIRED", "E-mail verification is required.");
  }

  static AuthenticationException sessionLimitReached() {
    return new AuthenticationException(
        HttpStatus.CONFLICT, "SESSION_LIMIT_REACHED", "Session limit reached.");
  }

  static AuthenticationException authenticationRequired() {
    return new AuthenticationException(
        HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }
}
