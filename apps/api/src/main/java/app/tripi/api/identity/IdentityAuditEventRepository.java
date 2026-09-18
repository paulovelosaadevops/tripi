package app.tripi.api.identity;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface IdentityAuditEventRepository extends JpaRepository<IdentityAuditEvent, UUID> {}
