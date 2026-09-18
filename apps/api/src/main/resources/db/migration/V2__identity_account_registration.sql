CREATE TABLE accounts (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  email_normalized text NOT NULL,
  status text NOT NULL,
  email_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 0,
  CONSTRAINT accounts_status_check CHECK (status IN ('PENDING_EMAIL_VERIFICATION', 'ACTIVE', 'DELETION_SCHEDULED', 'DELETED', 'SUSPENDED')),
  CONSTRAINT accounts_email_normalized_not_blank CHECK (length(trim(email_normalized)) > 0)
);

CREATE UNIQUE INDEX accounts_email_normalized_active_uidx
  ON accounts (email_normalized)
  WHERE deleted_at IS NULL;

CREATE INDEX accounts_status_idx
  ON accounts (status);

CREATE TABLE credentials (
  account_id uuid PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credentials_password_hash_not_blank CHECK (length(trim(password_hash)) > 0),
  CONSTRAINT credentials_password_hash_not_plain_check CHECK (password_hash LIKE '$argon2id$%')
);

CREATE TABLE user_profiles (
  account_id uuid PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
  display_name text NOT NULL,
  birthdate_confirmed boolean NOT NULL,
  support_email_locale text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_display_name_not_blank CHECK (length(trim(display_name)) > 0),
  CONSTRAINT user_profiles_birthdate_confirmed_check CHECK (birthdate_confirmed IS TRUE),
  CONSTRAINT user_profiles_locale_check CHECK (support_email_locale IN ('pt-BR', 'en-US'))
);

CREATE TABLE consent_acceptances (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_version text NOT NULL,
  locale text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  technical_context text NOT NULL,
  CONSTRAINT consent_acceptances_document_type_check CHECK (document_type IN ('TERMS_OF_USE', 'PRIVACY_POLICY')),
  CONSTRAINT consent_acceptances_locale_check CHECK (locale IN ('pt-BR', 'en-US')),
  CONSTRAINT consent_acceptances_version_not_blank CHECK (length(trim(document_version)) > 0),
  CONSTRAINT consent_acceptances_context_not_blank CHECK (length(trim(technical_context)) > 0),
  CONSTRAINT consent_acceptances_document_active_version_check CHECK (
    (document_type = 'TERMS_OF_USE' AND document_version = 'terms-v0.1')
    OR (document_type = 'PRIVACY_POLICY' AND document_version = 'privacy-v0.1')
  )
);

CREATE UNIQUE INDEX consent_acceptances_account_document_uidx
  ON consent_acceptances (account_id, document_type, document_version, locale);

CREATE INDEX consent_acceptances_account_idx
  ON consent_acceptances (account_id);
