package app.tripi.api.identity;

record RefreshRequest(String refreshToken) {
  @Override
  public String toString() {
    return "RefreshRequest[refreshToken=<redacted>]";
  }
}
