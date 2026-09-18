# ADR 0001 - Identity registration password hash and legal baselines

**Status:** Accepted
**Date:** 2026-09-18

## Context

The first functional backend increment implements secure account registration only. The approved technical and product documents require strong password hashing, minimum age confirmation and versioned legal consent, but did not define the concrete password hash parameters or the initial legal document versions.

## Decision

Password hashes for account registration use Argon2id, following OWASP Password Storage Cheat Sheet guidance.

Initial parameters:

- Memory: 19 MiB, represented as `m=19456` KiB.
- Iterations: `t=2`.
- Parallelism: `p=1`.
- Salt: unique, cryptographically secure and managed by the password hashing library.
- Stored value: standard encoded hash containing algorithm, parameters, salt and result.
- Pepper: not implemented in this increment.

The parameters must be centralized in backend configuration/code so they can be increased in a future migration without changing registration flow semantics.

Initial pre-beta legal baselines:

- Terms of Use version: `terms-v0.1`.
- Privacy Policy version: `privacy-v0.1`.
- Accepted locales: `pt-BR` and `en-US`.
- Version and locale are persisted separately.
- Conceptual document uniqueness is defined by document type, version and locale.
- Registration accepts only active backend-configured versions.

These baselines are technical pre-beta versions. They do not replace legal drafting and review. No external beta or commercial publication may happen without the corresponding legal texts available in both accepted locales.

## Consequences

- The registration endpoint can safely persist credentials without storing plain text passwords.
- Duplicate e-mails are compared by normalized case-insensitive value.
- Consent records are persisted independently for Terms of Use and Privacy Policy.
- Future password hash parameter increases are supported through centralized configuration and normal password verification.
