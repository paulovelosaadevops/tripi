package app.tripi.api.identity;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

interface RefreshTokenRepository extends JpaRepository<RefreshTokenRecord, UUID> {

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  Optional<RefreshTokenRecord> findByTokenHash(String tokenHash);
}
