CREATE TABLE identity_sessions (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  client_installation_id text NOT NULL,
  platform text NOT NULL,
  app_version text,
  device_name text,
  created_at timestamptz NOT NULL,
  last_activity_at timestamptz NOT NULL,
  inactivity_expires_at timestamptz NOT NULL,
  absolute_expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_reason text,
  version bigint NOT NULL DEFAULT 0,
  CONSTRAINT identity_sessions_platform_check CHECK (platform IN ('IOS', 'ANDROID', 'WEB', 'UNKNOWN')),
  CONSTRAINT identity_sessions_client_installation_not_blank CHECK (length(trim(client_installation_id)) > 0),
  CONSTRAINT identity_sessions_revoked_reason_check CHECK (
    (revoked_at IS NULL AND revoked_reason IS NULL)
    OR (revoked_at IS NOT NULL AND revoked_reason IS NOT NULL)
  )
);

CREATE INDEX identity_sessions_account_active_idx
  ON identity_sessions (account_id, revoked_at, inactivity_expires_at, absolute_expires_at);

CREATE TABLE refresh_token_families (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL UNIQUE REFERENCES identity_sessions (id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_reason text,
  reuse_detected_at timestamptz,
  CONSTRAINT refresh_token_families_revoked_reason_check CHECK (
    (revoked_at IS NULL AND revoked_reason IS NULL)
    OR (revoked_at IS NOT NULL AND revoked_reason IS NOT NULL)
  )
);

CREATE INDEX refresh_token_families_account_idx
  ON refresh_token_families (account_id);

CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES refresh_token_families (id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES identity_sessions (id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  revoked_at timestamptz,
  reuse_detected_at timestamptz,
  replaced_by_token_id uuid,
  CONSTRAINT refresh_tokens_hash_not_blank CHECK (length(trim(token_hash)) > 0),
  CONSTRAINT refresh_tokens_hash_unique UNIQUE (token_hash)
);

CREATE INDEX refresh_tokens_family_idx
  ON refresh_tokens (family_id);

CREATE INDEX refresh_tokens_session_idx
  ON refresh_tokens (session_id);

CREATE TABLE identity_audit_events (
  id uuid PRIMARY KEY,
  account_id uuid REFERENCES accounts (id) ON DELETE SET NULL,
  session_id uuid,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  metadata text NOT NULL,
  CONSTRAINT identity_audit_event_type_not_blank CHECK (length(trim(event_type)) > 0),
  CONSTRAINT identity_audit_metadata_not_blank CHECK (length(trim(metadata)) > 0)
);

CREATE INDEX identity_audit_events_account_idx
  ON identity_audit_events (account_id, occurred_at DESC);
