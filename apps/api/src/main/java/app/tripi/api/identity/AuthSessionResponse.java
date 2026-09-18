package app.tripi.api.identity;

import java.time.Instant;

record AuthSessionResponse(
    String accessToken,
    String refreshToken,
    Instant expiresAt,
    CurrentIdentityResponse user) {

  @Override
  public String toString() {
    return "AuthSessionResponse[accessToken=<redacted>, refreshToken=<redacted>, expiresAt="
        + expiresAt
        + ", user="
        + user
        + "]";
  }
}
