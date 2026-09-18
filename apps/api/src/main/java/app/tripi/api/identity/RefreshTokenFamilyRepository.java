package app.tripi.api.identity;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface RefreshTokenFamilyRepository extends JpaRepository<RefreshTokenFamily, UUID> {
  Optional<RefreshTokenFamily> findBySessionId(UUID sessionId);
}
