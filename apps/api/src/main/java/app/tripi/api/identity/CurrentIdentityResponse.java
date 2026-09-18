package app.tripi.api.identity;

import java.util.UUID;

record CurrentIdentityResponse(UUID id, String status, boolean emailVerified, UUID sessionId) {}
