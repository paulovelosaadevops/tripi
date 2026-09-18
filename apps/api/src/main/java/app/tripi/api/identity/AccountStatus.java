package app.tripi.api.identity;

enum AccountStatus {
  PENDING_EMAIL_VERIFICATION,
  ACTIVE,
  DELETION_SCHEDULED,
  DELETED,
  SUSPENDED
}
