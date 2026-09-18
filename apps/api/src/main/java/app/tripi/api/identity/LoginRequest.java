package app.tripi.api.identity;

record LoginRequest(
    String email,
    String password,
    String clientInstallationId,
    SessionPlatform platform,
    String appVersion,
    String deviceName) {

  @Override
  public String toString() {
    return "LoginRequest[email=<redacted>, password=<redacted>, clientInstallationId="
        + clientInstallationId
        + ", platform="
        + platform
        + ", appVersion="
        + appVersion
        + ", deviceName=<redacted>]";
  }
}
