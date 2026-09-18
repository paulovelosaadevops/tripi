package app.tripi.api.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import app.tripi.api.TripiApiApplication;
import com.jayway.jsonpath.JsonPath;
import com.nimbusds.jwt.SignedJWT;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(classes = TripiApiApplication.class)
@AutoConfigureMockMvc
@Testcontainers
class AuthenticationIntegrationTest {

  @Container
  private static final PostgreSQLContainer<?> postgres =
      new PostgreSQLContainer<>("postgres:18")
          .withDatabaseName("tripi")
          .withUsername("tripi")
          .withPassword("tripi-test");

  @Autowired private MockMvc mockMvc;
  @Autowired private JdbcTemplate jdbcTemplate;

  @DynamicPropertySource
  static void registerDataSource(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
    registry.add("tripi.identity.tokens.allow-ephemeral-keys", () -> "true");
  }

  @Test
  void loginIssuesMinimalJwtAndOpaqueRefreshTokenForActiveAccount() throws Exception {
    String accountId = registerAndActivate("login-valid@example.com");

    String response = login(" LOGIN-valid@example.com ", "correct horse battery", "install-1");

    assertThat(read(response, "$.accessToken")).isNotBlank();
    assertThat(read(response, "$.refreshToken")).isNotBlank();
    assertThat(response).doesNotContain("password").doesNotContain("token_hash");
    assertThat(read(response, "$.user.id")).isEqualTo(accountId);
    assertThat((Boolean) JsonPath.read(response, "$.user.emailVerified")).isTrue();

    SignedJWT jwt = SignedJWT.parse(read(response, "$.accessToken"));
    assertThat(jwt.getHeader().getAlgorithm().getName()).isEqualTo("RS256");
    assertThat(jwt.getHeader().getKeyID()).isEqualTo("local-dev");
    assertThat(jwt.getJWTClaimsSet().getIssuer()).isEqualTo("tripi-api");
    assertThat(jwt.getJWTClaimsSet().getAudience()).containsExactly("tripi-mobile");
    assertThat(jwt.getJWTClaimsSet().getSubject()).isEqualTo(accountId);
    assertThat(jwt.getJWTClaimsSet().getStringClaim("sid")).isNotBlank();
    assertThat(jwt.getJWTClaimsSet().getBooleanClaim("email_verified")).isTrue();
    assertThat(jwt.getJWTClaimsSet().getClaim("email")).isNull();
    assertThat(jwt.getJWTClaimsSet().getClaim("name")).isNull();
    assertThat(jwt.getJWTClaimsSet().getClaim("plan")).isNull();

    String hash =
        jdbcTemplate.queryForObject(
            "select token_hash from refresh_tokens where session_id = ?",
            String.class,
            UUID.fromString(read(response, "$.user.sessionId")));
    assertThat(hash).isNotEqualTo(read(response, "$.refreshToken"));
    assertThat(hash).hasSize(64);
  }

  @Test
  void rejectsInvalidPasswordAndMissingUserNeutrally() throws Exception {
    registerAndActivate("neutral@example.com");

    mockMvc
        .perform(loginRequest("neutral@example.com", "wrong password", "install-2"))
        .andExpect(status().isUnauthorized())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.code").value("AUTHENTICATION_FAILED"));

    mockMvc
        .perform(loginRequest("missing-neutral@example.com", "wrong password", "install-3"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("AUTHENTICATION_FAILED"));
  }

  @Test
  void rejectsAccountThatIsNotActiveOrVerified() throws Exception {
    register("not-verified@example.com");

    mockMvc
        .perform(loginRequest("not-verified@example.com", "correct horse battery", "install-4"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("EMAIL_VERIFICATION_REQUIRED"))
        .andExpect(jsonPath("$.accessToken").doesNotExist())
        .andExpect(jsonPath("$.refreshToken").doesNotExist());

    String suspendedId = registerAndActivate("suspended@example.com");
    jdbcTemplate.update("update accounts set status = 'SUSPENDED' where id = ?", UUID.fromString(suspendedId));
    mockMvc
        .perform(loginRequest("suspended@example.com", "correct horse battery", "install-5"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("AUTHENTICATION_FAILED"));
  }

  @Test
  void refreshRotatesTokenRejectsPreviousTokenAndRevokesFamilyOnReuse() throws Exception {
    registerAndActivate("refresh@example.com");
    String login = login("refresh@example.com", "correct horse battery", "install-6");
    String oldRefresh = read(login, "$.refreshToken");

    String refreshed = refresh(oldRefresh);
    String newRefresh = read(refreshed, "$.refreshToken");
    assertThat(newRefresh).isNotEqualTo(oldRefresh);

    mockMvc
        .perform(refreshRequest(oldRefresh))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));

    mockMvc
        .perform(refreshRequest(newRefresh))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));

    Integer reuseEvents =
        jdbcTemplate.queryForObject(
            "select count(*) from identity_audit_events where event_type = 'RefreshTokenReuseDetected'",
            Integer.class);
    assertThat(reuseEvents).isGreaterThanOrEqualTo(1);
  }

  @Test
  void refreshRejectsExpiredToken() throws Exception {
    registerAndActivate("expired-refresh@example.com");
    String login = login("expired-refresh@example.com", "correct horse battery", "install-7");
    jdbcTemplate.update("update refresh_tokens set expires_at = now() - interval '1 minute'");

    mockMvc.perform(refreshRequest(read(login, "$.refreshToken"))).andExpect(status().isUnauthorized());
  }

  @Test
  void logoutIsIdempotentAndRevokesFutureRefreshes() throws Exception {
    registerAndActivate("logout@example.com");
    String login = login("logout@example.com", "correct horse battery", "install-8");
    String accessToken = read(login, "$.accessToken");

    mockMvc.perform(post("/v1/auth/logout").header(HttpHeaders.AUTHORIZATION, bearer(accessToken))).andExpect(status().isNoContent());
    mockMvc.perform(post("/v1/auth/logout").header(HttpHeaders.AUTHORIZATION, bearer(accessToken))).andExpect(status().isNoContent());
    mockMvc.perform(refreshRequest(read(login, "$.refreshToken"))).andExpect(status().isUnauthorized());
  }

  @Test
  void protectsCurrentIdentityAndRejectsInvalidToken() throws Exception {
    registerAndActivate("me@example.com");
    String login = login("me@example.com", "correct horse battery", "install-9");

    mockMvc.perform(get("/v1/me")).andExpect(status().isUnauthorized());
    mockMvc.perform(get("/v1/me").header(HttpHeaders.AUTHORIZATION, "Bearer invalid")).andExpect(status().isUnauthorized());
    mockMvc
        .perform(get("/v1/me").header(HttpHeaders.AUTHORIZATION, bearer(read(login, "$.accessToken"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").isString())
        .andExpect(jsonPath("$.sessionId").value(read(login, "$.user.sessionId")));
  }

  @Test
  void listsAndRevokesOnlyOwnSessions() throws Exception {
    registerAndActivate("sessions-a@example.com");
    registerAndActivate("sessions-b@example.com");
    String a1 = login("sessions-a@example.com", "correct horse battery", "install-10");
    String a2 = login("sessions-a@example.com", "correct horse battery", "install-11");
    String b1 = login("sessions-b@example.com", "correct horse battery", "install-12");

    mockMvc
        .perform(get("/v1/me/sessions").header(HttpHeaders.AUTHORIZATION, bearer(read(a1, "$.accessToken"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.length()").value(2));

    mockMvc
        .perform(
            delete("/v1/me/sessions/{sessionId}", read(b1, "$.user.sessionId"))
                .header(HttpHeaders.AUTHORIZATION, bearer(read(a1, "$.accessToken"))))
        .andExpect(status().isNoContent());

    Boolean bRevoked =
        jdbcTemplate.queryForObject(
            "select revoked_at is not null from identity_sessions where id = ?",
            Boolean.class,
            UUID.fromString(read(b1, "$.user.sessionId")));
    assertThat(bRevoked).isFalse();

    mockMvc
        .perform(delete("/v1/me/sessions/others").header(HttpHeaders.AUTHORIZATION, bearer(read(a1, "$.accessToken"))))
        .andExpect(status().isNoContent());
    mockMvc.perform(refreshRequest(read(a2, "$.refreshToken"))).andExpect(status().isUnauthorized());
    mockMvc.perform(refreshRequest(read(a1, "$.refreshToken"))).andExpect(status().isOk());
  }

  @Test
  void rejectsLoginWhenSessionLimitIsReached() throws Exception {
    registerAndActivate("limit@example.com");
    for (int index = 0; index < 10; index++) {
      login("limit@example.com", "correct horse battery", "limit-" + index);
    }
    mockMvc
        .perform(loginRequest("limit@example.com", "correct horse battery", "limit-extra"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("SESSION_LIMIT_REACHED"));
  }

  @Test
  void onlyOneConcurrentRefreshSucceeds() throws Exception {
    registerAndActivate("concurrent@example.com");
    String login = login("concurrent@example.com", "correct horse battery", "install-13");
    String refreshToken = read(login, "$.refreshToken");
    try (var executor = Executors.newFixedThreadPool(2)) {
      List<Callable<Integer>> calls =
          List.of(
              () -> mockMvc.perform(refreshRequest(refreshToken)).andReturn().getResponse().getStatus(),
              () -> mockMvc.perform(refreshRequest(refreshToken)).andReturn().getResponse().getStatus());
      List<Integer> statuses = executor.invokeAll(calls).stream().map(
          future -> {
            try {
              return future.get();
            } catch (Exception exception) {
              throw new RuntimeException(exception);
            }
          }).toList();
      assertThat(statuses).contains(200).contains(401);
    }
  }

  @Test
  void executableOpenApiDocumentsLoginAndSessionsWithoutSecrets() throws Exception {
    String openApi = java.nio.file.Files.readString(java.nio.file.Path.of("src/main/resources/openapi/tripi-api.yml"));
    assertThat(openApi).contains("/v1/auth/login");
    assertThat(openApi).contains("/v1/auth/refresh");
    assertThat(openApi).contains("/v1/auth/logout");
    assertThat(openApi).contains("/v1/me/sessions");
    assertThat(openApi).contains("bearerFormat: JWT");
    assertThat(openApi).doesNotContain("token_hash");
    assertThat(openApi).doesNotContain("passwordHash");
  }

  private String registerAndActivate(String email) throws Exception {
    String accountId = register(email);
    jdbcTemplate.update(
        "update accounts set status = 'ACTIVE', email_verified_at = now() where id = ?",
        UUID.fromString(accountId));
    return accountId;
  }

  private String register(String email) throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "name": "Technical User",
                          "email": "%s",
                          "password": "correct horse battery",
                          "locale": "pt-BR",
                          "ageConfirmed": true,
                          "acceptedTermsVersion": "terms-v0.1",
                          "acceptedPrivacyVersion": "privacy-v0.1"
                        }
                        """
                            .formatted(email)))
            .andExpect(status().isCreated())
            .andReturn();
    return read(result.getResponse().getContentAsString(), "$.id");
  }

  private String login(String email, String password, String installationId) throws Exception {
    MvcResult result =
        mockMvc.perform(loginRequest(email, password, installationId)).andExpect(status().isOk()).andReturn();
    return result.getResponse().getContentAsString();
  }

  private String refresh(String refreshToken) throws Exception {
    MvcResult result = mockMvc.perform(refreshRequest(refreshToken)).andExpect(status().isOk()).andReturn();
    return result.getResponse().getContentAsString();
  }

  private String read(String json, String path) {
    return JsonPath.read(json, path);
  }

  private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder loginRequest(
      String email, String password, String installationId) {
    return post("/v1/auth/login")
        .contentType(MediaType.APPLICATION_JSON)
        .content(
            """
            {
              "email": "%s",
              "password": "%s",
              "clientInstallationId": "%s",
              "platform": "ANDROID",
              "appVersion": "0.1.0",
              "deviceName": "technical-test-device"
            }
            """
                .formatted(email, password, installationId));
  }

  private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder refreshRequest(String refreshToken) {
    return post("/v1/auth/refresh")
        .contentType(MediaType.APPLICATION_JSON)
        .content(
            """
            {
              "refreshToken": "%s"
            }
            """
                .formatted(refreshToken));
  }

  private String bearer(String token) {
    return "Bearer " + token;
  }
}
