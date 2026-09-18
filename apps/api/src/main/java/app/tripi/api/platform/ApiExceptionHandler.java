package app.tripi.api.platform;

import app.tripi.api.identity.ApiFieldViolation;
import app.tripi.api.identity.DuplicateAccountException;
import app.tripi.api.identity.InvalidRegistrationRequest;
import java.net.URI;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
class ApiExceptionHandler {

  @ExceptionHandler(InvalidRegistrationRequest.class)
  ProblemDetail handleInvalidRegistration(InvalidRegistrationRequest exception) {
    ProblemDetail problem =
        ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, "Request validation failed.");
    problem.setTitle("Validation failed");
    problem.setType(URI.create("https://api.tripi.app/problems/validation-failed"));
    problem.setProperty("code", "VALIDATION_FAILED");
    problem.setProperty("violations", exception.violations());
    return problem;
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ProblemDetail handleBeanValidation(MethodArgumentNotValidException exception) {
    List<ApiFieldViolation> violations =
        exception.getBindingResult().getFieldErrors().stream()
            .map(
                error ->
                    new ApiFieldViolation(
                        error.getField(), "VALIDATION_FAILED", "Field value is invalid."))
            .toList();

    ProblemDetail problem =
        ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, "Request validation failed.");
    problem.setTitle("Validation failed");
    problem.setType(URI.create("https://api.tripi.app/problems/validation-failed"));
    problem.setProperty("code", "VALIDATION_FAILED");
    problem.setProperty("violations", violations);
    return problem;
  }

  @ExceptionHandler(DuplicateAccountException.class)
  ProblemDetail handleDuplicateAccount() {
    ProblemDetail problem =
        ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Account registration cannot be completed.");
    problem.setTitle("Conflict");
    problem.setType(URI.create("https://api.tripi.app/problems/account-conflict"));
    problem.setProperty("code", "ACCOUNT_CONFLICT");
    return problem;
  }
}
