package app.tripi.api.identity;

import java.time.Instant;

record IssuedAccessToken(String value, Instant expiresAt) {}
