package br.com.nucleo.api.audit.dto;

import br.com.nucleo.api.audit.domain.AuditAction;
import br.com.nucleo.api.audit.domain.AuditEvent;
import br.com.nucleo.api.audit.domain.AuditResourceType;
import java.time.Instant;
import java.util.UUID;

public record AuditEventResponse(
        UUID id,
        AuditAction action,
        AuditResourceType resourceType,
        UUID resourceId,
        String description,
        String metadataJson,
        UUID actorUserId,
        String actorName,
        String actorEmail,
        String ipAddress,
        String userAgent,
        Instant occurredAt
) {

    public static AuditEventResponse from(
            AuditEvent event
    ) {
        UUID actorUserId = null;
        String actorName = null;
        String actorEmail = null;

        if (event.getActor() != null) {
            actorUserId = event.getActor().getId();
            actorName = event.getActor().getName();
            actorEmail = event.getActor().getEmail();
        }

        return new AuditEventResponse(
                event.getId(),
                event.getAction(),
                event.getResourceType(),
                event.getResourceId(),
                event.getDescription(),
                event.getMetadataJson(),
                actorUserId,
                actorName,
                actorEmail,
                event.getIpAddress(),
                event.getUserAgent(),
                event.getOccurredAt()
        );
    }
}