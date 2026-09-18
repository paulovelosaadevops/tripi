package app.tripi.api.identity;

import jakarta.transaction.Transactional;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
class AuthenticationService {

  private static final int MAX_ACTIVE_SESSIONS = 10;

  private final AccountRepository accounts;
  private final CredentialRepository credentials;
  private final IdentitySessionRepository sessions;
  private final RefreshTokenFamilyRepository families;
  private final RefreshTokenRepository refreshTokens;
  private final UserProfileRepository profiles;
  private final IdentityAuditEventRepository auditEvents;
  private final EmailNormalizer emailNormalizer;
  private final PasswordEncoder passwordEncoder;
  private final RefreshTokenGenerator refreshTokenGenerator;
  private final AccessTokenService accessTokenService;
  private final TokenProperties tokenProperties;
  private final Clock clock;

  AuthenticationService(
      AccountRepository accounts,
      CredentialRepository credentials,
      IdentitySessionRepository sessions,
      RefreshTokenFamilyRepository families,
      RefreshTokenRepository refreshTokens,
      UserProfileRepository profiles,
      IdentityAuditEventRepository auditEvents,
      EmailNormalizer emailNormalizer,
      PasswordEncoder passwordEncoder,
      RefreshTokenGenerator refreshTokenGenerator,
      AccessTokenService accessTokenService,
      TokenProperties tokenProperties,
      Clock clock) {
    this.accounts = accounts;
    this.credentials = credentials;
    this.sessions = sessions;
    this.families = families;
    this.refreshTokens = refreshTokens;
    this.profiles = profiles;
    this.auditEvents = auditEvents;
    this.emailNormalizer = emailNormalizer;
    this.passwordEncoder = passwordEncoder;
    this.refreshTokenGenerator = refreshTokenGenerator;
    this.accessTokenService = accessTokenService;
    this.tokenProperties = tokenProperties;
    this.clock = clock;
  }

  @Transactional(dontRollbackOn = AuthenticationException.class)
  AuthSessionResponse login(LoginRequest request) {
    Instant now = clock.instant();
    String normalizedEmail = emailNormalizer.normalize(request.email());
    Account account =
        accounts
            .findByEmailNormalizedAndDeletedAtIsNull(normalizedEmail)
            .orElseThrow(
                () -> {
                  passwordEncoder.matches(request.password() == null ? "" : request.password(), neutralHash());
                  audit(null, null, "LoginFailed", now, "neutral");
                  return AuthenticationException.invalidCredentials();
                });
    Credential credential = credentials.findByAccountId(account.id()).orElseThrow(AuthenticationException::invalidCredentials);
    if (!passwordEncoder.matches(request.password() == null ? "" : request.password(), credential.passwordHash())) {
      audit(account.id(), null, "LoginFailed", now, "neutral");
      throw AuthenticationException.invalidCredentials();
    }
    if (account.status() == AccountStatus.PENDING_EMAIL_VERIFICATION || !account.isEmailVerified()) {
      audit(account.id(), null, "LoginBlocked", now, "email_verification_required");
      throw AuthenticationException.emailVerificationRequired();
    }
    if (account.status() != AccountStatus.ACTIVE) {
      audit(account.id(), null, "LoginFailed", now, "account_state_not_allowed");
      throw AuthenticationException.invalidCredentials();
    }
    if (sessions.countActiveByAccountId(account.id(), now) >= MAX_ACTIVE_SESSIONS) {
      audit(account.id(), null, "LoginRejected", now, "session_limit_reached");
      throw AuthenticationException.sessionLimitReached();
    }

    IdentitySession session =
        new IdentitySession(
            UUID.randomUUID(),
            account.id(),
            requiredInstallationId(request.clientInstallationId()),
            request.platform() == null ? SessionPlatform.UNKNOWN : request.platform(),
            blankToNull(request.appVersion()),
            blankToNull(request.deviceName()),
            now,
            now.plus(tokenProperties.sessionInactivityTtl()),
            now.plus(tokenProperties.sessionAbsoluteTtl()));
    sessions.save(session);
    RefreshTokenFamily family = new RefreshTokenFamily(UUID.randomUUID(), session.id(), account.id(), now);
    families.save(family);
    String refreshToken = refreshTokenGenerator.generate();
    refreshTokens.save(
        new RefreshTokenRecord(
            UUID.randomUUID(),
            family.id(),
            session.id(),
            refreshTokenGenerator.hash(refreshToken),
            now,
            now.plus(tokenProperties.sessionInactivityTtl())));
    audit(account.id(), session.id(), "LoginSucceeded", now, "password");
    return response(account, session, refreshToken);
  }

  @Transactional(dontRollbackOn = AuthenticationException.class)
  AuthSessionResponse refresh(RefreshRequest request) {
    Instant now = clock.instant();
    if (request.refreshToken() == null || request.refreshToken().isBlank()) {
      throw AuthenticationException.authenticationRequired();
    }
    RefreshTokenRecord current =
        refreshTokens
            .findByTokenHash(refreshTokenGenerator.hash(request.refreshToken()))
            .orElseThrow(AuthenticationException::authenticationRequired);
    RefreshTokenFamily family = families.findById(current.familyId()).orElseThrow(AuthenticationException::authenticationRequired);
    IdentitySession session = sessions.findById(current.sessionId()).orElseThrow(AuthenticationException::authenticationRequired);
    Account account = accounts.findById(session.accountId()).orElseThrow(AuthenticationException::authenticationRequired);

    if (current.wasAlreadyUsed()) {
      current.detectReuse(now);
      family.detectReuse(now);
      session.revoke(now, "REFRESH_TOKEN_REUSE");
      audit(account.id(), session.id(), "RefreshTokenReuseDetected", now, "family_revoked");
      throw AuthenticationException.authenticationRequired();
    }
    if (!current.isUsable(now) || !family.isActive() || !session.isActive(now) || account.status() != AccountStatus.ACTIVE) {
      current.revoke(now);
      throw AuthenticationException.authenticationRequired();
    }

    String nextRefreshToken = refreshTokenGenerator.generate();
    RefreshTokenRecord next =
        new RefreshTokenRecord(
            UUID.randomUUID(),
            family.id(),
            session.id(),
            refreshTokenGenerator.hash(nextRefreshToken),
            now,
            now.plus(tokenProperties.sessionInactivityTtl()));
    session.touch(now, now.plus(tokenProperties.sessionInactivityTtl()));
    current.consume(now, next.id());
    refreshTokens.save(next);
    audit(account.id(), session.id(), "SessionRefreshed", now, "rotated");
    return response(account, session, nextRefreshToken);
  }

  @Transactional
  void logout(AuthenticatedIdentity identity) {
    Instant now = clock.instant();
    sessions
        .findByIdAndAccountId(identity.sessionId(), identity.accountId())
        .ifPresent(
            session -> {
              session.revoke(now, "LOGOUT");
              families.findBySessionId(session.id()).ifPresent(family -> family.revoke(now, "LOGOUT"));
              audit(identity.accountId(), session.id(), "SessionRevoked", now, "logout");
            });
  }

  @Transactional
  void revokeSession(AuthenticatedIdentity identity, UUID sessionId) {
    Instant now = clock.instant();
    sessions
        .findByIdAndAccountId(sessionId, identity.accountId())
        .ifPresent(
            session -> {
              session.revoke(now, "USER_REVOKED");
              families.findBySessionId(session.id()).ifPresent(family -> family.revoke(now, "USER_REVOKED"));
              audit(identity.accountId(), session.id(), "SessionRevoked", now, "user_revoke");
            });
  }

  @Transactional
  void revokeOtherSessions(AuthenticatedIdentity identity) {
    Instant now = clock.instant();
    sessions.findByAccountIdOrderByLastActivityAtDesc(identity.accountId()).stream()
        .filter(session -> !session.id().equals(identity.sessionId()))
        .forEach(
            session -> {
              session.revoke(now, "USER_REVOKED_OTHERS");
              families.findBySessionId(session.id()).ifPresent(family -> family.revoke(now, "USER_REVOKED_OTHERS"));
              audit(identity.accountId(), session.id(), "SessionRevoked", now, "user_revoke_others");
            });
  }

  CurrentIdentityResponse currentIdentity(AuthenticatedIdentity identity) {
    Account account = accounts.findById(identity.accountId()).orElseThrow(AuthenticationException::authenticationRequired);
    return new CurrentIdentityResponse(account.id(), account.status().name(), account.isEmailVerified(), identity.sessionId());
  }

  SessionListResponse listSessions(AuthenticatedIdentity identity) {
    Instant now = clock.instant();
    List<SessionResponse> data =
        sessions.findByAccountIdOrderByLastActivityAtDesc(identity.accountId()).stream()
            .map(session -> SessionResponse.from(session, identity.sessionId(), now))
            .toList();
    return new SessionListResponse(data);
  }

  private AuthSessionResponse response(Account account, IdentitySession session, String refreshToken) {
    IssuedAccessToken accessToken = accessTokenService.issue(account, session);
    return new AuthSessionResponse(
        accessToken.value(),
        refreshToken,
        accessToken.expiresAt(),
        new CurrentIdentityResponse(account.id(), account.status().name(), account.isEmailVerified(), session.id()));
  }

  private void audit(UUID accountId, UUID sessionId, String type, Instant now, String metadata) {
    auditEvents.save(new IdentityAuditEvent(accountId, sessionId, type, now, metadata));
  }

  private String requiredInstallationId(String value) {
    String sanitized = blankToNull(value);
    if (sanitized == null) {
      return "unknown";
    }
    return sanitized.length() > 160 ? sanitized.substring(0, 160) : sanitized;
  }

  private String blankToNull(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }

  private String neutralHash() {
    return "$argon2id$v=19$m=19456,t=2,p=1$MTIzNDU2Nzg5MDEyMzQ1Ng$u9aonh8y07FT7WNqow5p9LfqLDxyl1pwQei0yLdBYwQ";
  }
}
