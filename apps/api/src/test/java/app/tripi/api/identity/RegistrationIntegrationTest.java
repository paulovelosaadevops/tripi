package app.tripi.api.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import app.tripi.api.TripiApiApplication;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(classes = TripiApiApplication.class)
@AutoConfigureMockMvc
@Testcontainers
class RegistrationIntegrationTest {

  @Container
  private static final PostgreSQLContainer<?> postgres =
      new PostgreSQLContainer<>("postgres:18")
          .withDatabaseName("tripi")
          .withUsername("tripi")
          .withPassword("tripi-test");

  @Autowired private MockMvc mockMvc;
  @Autowired private JdbcTemplate jdbcTemplate;
  @Autowired private InternalCredentialVerifier credentialVerifier;

  @DynamicPropertySource
  static void registerDataSource(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
    registry.add("tripi.identity.tokens.allow-ephemeral-keys", () -> "true");
  }

  @Test
  void registersAccountWithNormalizedEmailConsentAndPasswordHash() throws Exception {
    String email = "  Founding.User+valid@Example.COM ";
    String password = "correct horse battery";

    mockMvc
        .perform(
            post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "name": "Founding User",
                      "email": "%s",
                      "password": "%s",
                      "locale": "pt-BR",
                      "ageConfirmed": true,
                      "acceptedTermsVersion": "terms-v0.1",
                      "acceptedPrivacyVersion": "privacy-v0.1"
                    }
                    """
                        .formatted(email, password)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").isString())
        .andExpect(jsonPath("$.email").value("Founding.User+valid@Example.COM"))
        .andExpect(jsonPath("$.name").value("Founding User"))
        .andExpect(jsonPath("$.status").value("PENDING_EMAIL_VERIFICATION"))
        .andExpect(jsonPath("$.locale").value("pt-BR"))
        .andExpect(jsonPath("$.acceptedTermsVersion").value("terms-v0.1"))
        .andExpect(jsonPath("$.acceptedPrivacyVersion").value("privacy-v0.1"))
        .andExpect(jsonPath("$.password").doesNotExist())
        .andExpect(jsonPath("$.passwordHash").doesNotExist());

    Map<String, Object> account =
        jdbcTemplate.queryForMap(
            "select id, email_normalized, status from accounts where email_normalized = ?",
            "founding.user+valid@example.com");
    assertThat(account.get("status")).isEqualTo("PENDING_EMAIL_VERIFICATION");

    String passwordHash =
        jdbcTemplate.queryForObject(
            "select password_hash from credentials where account_id = ?",
            String.class,
            account.get("id"));
    assertThat(passwordHash).isNotEqualTo(password);
    assertThat(passwordHash).startsWith("$argon2id$v=19$m=19456,t=2,p=1$");

    Integer consentCount =
        jdbcTemplate.queryForObject(
            """
            select count(*) from consent_acceptances
            where account_id = ?
              and locale = 'pt-BR'
              and ((document_type = 'TERMS_OF_USE' and document_version = 'terms-v0.1')
                or (document_type = 'PRIVACY_POLICY' and document_version = 'privacy-v0.1'))
            """,
            Integer.class,
            account.get("id"));
    assertThat(consentCount).isEqualTo(2);
    assertThat(credentialVerifier.matches("FOUNDING.USER+VALID@example.com", password)).isTrue();
    assertThat(credentialVerifier.matches("FOUNDING.USER+VALID@example.com", "wrong password")).isFalse();
    assertThat(credentialVerifier.matches("missing@example.com", "wrong password")).isFalse();
  }

  @Test
  void rejectsDuplicateEmailCaseInsensitively() throws Exception {
    register("duplicate@example.com", "en-US", "Duplicate User");

    mockMvc
        .perform(
            post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validPayload(" DUPLICATE@example.com ", "en-US", "Duplicate User Two")))
        .andExpect(status().isConflict())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.code").value("ACCOUNT_CONFLICT"));
  }

  @Test
  void rejectsInvalidEmailWithStandardProblem() throws Exception {
    mockMvc
        .perform(
            post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validPayload("not-an-email", "pt-BR", "Invalid Email")))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
        .andExpect(jsonPath("$.violations[0].field").value("email"));
  }

  @Test
  void rejectsPasswordOutsidePolicy() throws Exception {
    mockMvc
        .perform(
            post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "name": "Weak Password",
                      "email": "weak-password@example.com",
                      "password": "short",
                      "locale": "pt-BR",
                      "ageConfirmed": true,
                      "acceptedTermsVersion": "terms-v0.1",
                      "acceptedPrivacyVersion": "privacy-v0.1"
                    }
                    """))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
        .andExpect(jsonPath("$.violations[0].field").value("password"));
  }

  @Test
  void rejectsMissingConsent() throws Exception {
    mockMvc
        .perform(
            post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "name": "No Consent",
                      "email": "no-consent@example.com",
                      "password": "correct horse battery",
                      "locale": "pt-BR",
                      "ageConfirmed": true,
                      "acceptedTermsVersion": "terms-v0.1"
                    }
                    """))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
        .andExpect(jsonPath("$.violations[0].field").value("acceptedPrivacyVersion"));
  }

  @Test
  void rejectsInactiveConsentVersion() throws Exception {
    mockMvc
        .perform(
            post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "name": "Old Consent",
                      "email": "old-consent@example.com",
                      "password": "correct horse battery",
                      "locale": "pt-BR",
                      "ageConfirmed": true,
                      "acceptedTermsVersion": "terms-v9.9",
                      "acceptedPrivacyVersion": "privacy-v0.1"
                    }
                    """))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.violations[0].code").value("INACTIVE_LEGAL_VERSION"));
  }

  @Test
  void rejectsMinorUser() throws Exception {
    mockMvc
        .perform(
            post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "name": "Minor User",
                      "email": "minor@example.com",
                      "password": "correct horse battery",
                      "locale": "pt-BR",
                      "ageConfirmed": false,
                      "acceptedTermsVersion": "terms-v0.1",
                      "acceptedPrivacyVersion": "privacy-v0.1"
                    }
                    """))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.violations[0].field").value("ageConfirmed"));
  }

  @Test
  void rejectsUnsupportedLocale() throws Exception {
    mockMvc
        .perform(
            post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validPayload("locale@example.com", "es-ES", "Locale User")))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.violations[0].field").value("locale"));
  }

  @Test
  void executableOpenApiDoesNotExposeRegistrationPasswordHash() throws Exception {
    String openApi = java.nio.file.Files.readString(java.nio.file.Path.of("src/main/resources/openapi/tripi-api.yml"));

    assertThat(openApi).contains("/v1/auth/register");
    assertThat(openApi).contains("RegisterAccountRequest");
    assertThat(openApi).contains("RegisterAccountResponse");
    assertThat(openApi).doesNotContain("passwordHash");
  }

  private void register(String email, String locale, String name) throws Exception {
    mockMvc
        .perform(
            post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validPayload(email, locale, name)))
        .andExpect(status().isCreated());
  }

  private String validPayload(String email, String locale, String name) {
    return """
        {
          "name": "%s",
          "email": "%s",
          "password": "correct horse battery",
          "locale": "%s",
          "ageConfirmed": true,
          "acceptedTermsVersion": "terms-v0.1",
          "acceptedPrivacyVersion": "privacy-v0.1"
        }
        """
        .formatted(name, email, locale);
  }
}
