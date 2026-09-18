package app.tripi.api.identity;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface IdentitySessionRepository extends JpaRepository<IdentitySession, UUID> {

  @Query(
      """
      select count(s) from IdentitySession s
      where s.accountId = :accountId
        and s.revokedAt is null
        and s.inactivityExpiresAt > :now
        and s.absoluteExpiresAt > :now
      """)
  long countActiveByAccountId(@Param("accountId") UUID accountId, @Param("now") Instant now);

  List<IdentitySession> findByAccountIdOrderByLastActivityAtDesc(UUID accountId);

  Optional<IdentitySession> findByIdAndAccountId(UUID id, UUID accountId);
}
