package app.tripi.api.identity;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
class RegistrationController {

  private final RegistrationService registrationService;

  RegistrationController(RegistrationService registrationService) {
    this.registrationService = registrationService;
  }

  @PostMapping("/v1/auth/register")
  @ResponseStatus(HttpStatus.CREATED)
  RegisterAccountResponse register(@Valid @RequestBody RegisterAccountRequest request) {
    return registrationService.register(request);
  }
}
