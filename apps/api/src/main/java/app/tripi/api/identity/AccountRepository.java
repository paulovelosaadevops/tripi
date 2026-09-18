package app.tripi.api.identity;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface AccountRepository extends JpaRepository<Account, UUID> {
  boolean existsByEmailNormalizedAndDeletedAtIsNull(String emailNormalized);

  Optional<Account> findByEmailNormalizedAndDeletedAtIsNull(String emailNormalized);
}
