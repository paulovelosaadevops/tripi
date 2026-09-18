package app.tripi.api.identity;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
class AuthenticationController {

  private final AuthenticationService authenticationService;

  AuthenticationController(AuthenticationService authenticationService) {
    this.authenticationService = authenticationService;
  }

  @PostMapping("/v1/auth/login")
  AuthSessionResponse login(@RequestBody LoginRequest request) {
    return authenticationService.login(request);
  }

  @PostMapping("/v1/auth/refresh")
  AuthSessionResponse refresh(@RequestBody RefreshRequest request) {
    return authenticationService.refresh(request);
  }

  @PostMapping("/v1/auth/logout")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void logout(Authentication authentication) {
    authenticationService.logout(AuthenticatedIdentity.from(authentication));
  }

  @GetMapping("/v1/me")
  CurrentIdentityResponse me(Authentication authentication) {
    return authenticationService.currentIdentity(AuthenticatedIdentity.from(authentication));
  }

  @GetMapping("/v1/me/sessions")
  SessionListResponse sessions(Authentication authentication) {
    return authenticationService.listSessions(AuthenticatedIdentity.from(authentication));
  }

  @DeleteMapping("/v1/me/sessions/{sessionId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void revokeSession(Authentication authentication, @PathVariable UUID sessionId) {
    authenticationService.revokeSession(AuthenticatedIdentity.from(authentication), sessionId);
  }

  @DeleteMapping("/v1/me/sessions/others")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void revokeOtherSessions(Authentication authentication) {
    authenticationService.revokeOtherSessions(AuthenticatedIdentity.from(authentication));
  }
}
