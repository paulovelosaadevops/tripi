package app.tripi.api.identity;

public class DuplicateAccountException extends RuntimeException {
  DuplicateAccountException() {
    super("Account already exists.");
  }
}
