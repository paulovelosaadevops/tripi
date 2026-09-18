# ADR 0002 - Identity login tokens and sessions

**Status:** Accepted
**Date:** 2026-09-18

## Context

The second Identity backend increment implements login, access tokens, refresh tokens, sessions and logout. The product and technical baselines already require short-lived access tokens, rotating refresh tokens, multiple sessions per account, revocation and reuse detection, but the concrete security parameters were intentionally left open.

## Decision

Access tokens are JWTs signed with RS256.

- TTL: 15 minutes.
- Issuer: configurable, default local value `tripi-api`.
- Audience: configurable, default local value `tripi-mobile`.
- Maximum clock skew: 60 seconds.
- Each token has a unique `jti`.
- Allowed claims only: `sub`, `sid`, `iss`, `aud`, `iat`, `nbf`, `exp`, `jti`, `email_verified`.
- Tokens must not include name, e-mail, plan, trip role, financial permissions or personal data.
- Trip permissions are always resolved by the backend, not frozen in the token.

JWT signing keys are RSA keys supplied by environment-backed configuration.

- Private keys are never versioned.
- Public keys are configured separately for validation.
- Tokens include `kid` to support future key rotation.
- Tests may generate isolated ephemeral keys.
- Missing or invalid key configuration must prevent non-test application startup.

Refresh tokens are opaque secrets.

- Generated with a CSPRNG.
- Minimum entropy: 256 bits.
- Encoded as Base64 URL-safe without padding.
- Only the SHA-256 hash is persisted.
- The hash is never logged or returned.
- Every refresh rotates the token.
- The previous token is invalidated in the same transaction.
- There is no reuse grace window.
- Mobile must later implement refresh single-flight.

Each login creates one session and one refresh-token family. Reuse of an already rotated token revokes the whole family and the session, and records a technical security event without storing the token. Concurrent refreshes must use PostgreSQL transactions and row locking so only one rotation succeeds.

Session duration:

- Maximum inactivity: 30 days.
- Absolute lifetime: 90 days from login.
- Each rotation can extend inactivity expiration, never beyond the absolute limit.
- Logout revokes the session immediately for future refreshes.
- Already issued access tokens remain valid until their 15-minute expiration.

Sessions:

- At most 10 active sessions per account.
- A new login at the limit is rejected with `SESSION_LIMIT_REACHED`.
- Existing devices are not silently revoked.
- A session stores only: id, account, client installation id, platform, app version, optional technical device name, creation time, last activity, inactivity expiration, absolute expiration, revocation time and revocation reason.
- No invasive hardware fingerprinting is used.
- IP address and User-Agent, if later needed for audit, must follow the minimization and retention rules from the domain model.

Account status rules:

- Registration starts as `PENDING_EMAIL_VERIFICATION`.
- Password login is allowed only for `ACTIVE` accounts with verified e-mail.
- Non-verified accounts receive `EMAIL_VERIFICATION_REQUIRED` without tokens.
- Suspended, deletion-scheduled or deleted accounts do not receive tokens.
- Responses must avoid account enumeration.
- Until the e-mail verification increment exists, tests and manual validation may activate a technical account directly in the database.

Endpoints authorized for this increment:

- Login.
- Refresh.
- Logout of the current session.
- Current identity/session lookup.
- List own sessions.
- Revoke one own session.
- Revoke all other own sessions.

Logout rules:

- Logout of the current session is idempotent.
- Users can never revoke another account's session.
- Revoking all other sessions preserves the current session.
- Future password change must revoke all sessions, but that belongs to the password recovery increment.

Future mobile storage:

- Refresh tokens must be stored in the platform secure storage.
- Access tokens should preferably remain in memory.
- The mobile application is not changed in this increment.

References:

- RFC 9700 - OAuth 2.0 Security Best Current Practice.
- OWASP Session Management Cheat Sheet.
- OWASP JSON Web Token for Java Cheat Sheet.

## Consequences

- Access-token verification can be stateless for the short token lifetime, while refresh and logout remain server-authoritative.
- Session revocation is immediate for refresh operations, but already issued access tokens may remain valid for up to 15 minutes.
- The backend must keep key material outside the repository and fail fast when production-like configuration is incomplete.
- Refresh-token storage is resilient to database disclosure because only hashes are persisted.
