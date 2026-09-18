package app.tripi.api.identity;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface CredentialRepository extends JpaRepository<Credential, UUID> {
  Optional<Credential> findByAccountId(UUID accountId);
}
