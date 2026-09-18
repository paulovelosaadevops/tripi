package app.tripi.api.identity;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface ConsentAcceptanceRepository extends JpaRepository<ConsentAcceptance, UUID> {
  List<ConsentAcceptance> findByAccountId(UUID accountId);
}
