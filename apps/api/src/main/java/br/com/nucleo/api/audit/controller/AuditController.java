package br.com.nucleo.api.audit.controller;

import br.com.nucleo.api.audit.domain.AuditAction;
import br.com.nucleo.api.audit.domain.AuditResourceType;
import br.com.nucleo.api.audit.dto.AuditEventResponse;
import br.com.nucleo.api.audit.service.AuditService;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit-events")
public class AuditController {

    private final AuditService auditService;

    public AuditController(
            AuditService auditService
    ) {
        this.auditService = auditService;
    }

    @GetMapping
    public Page<AuditEventResponse> search(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false)
            UUID actorUserId,
            @RequestParam(required = false)
            AuditAction action,
            @RequestParam(required = false)
            AuditResourceType resourceType,
            @RequestParam(required = false)
            UUID resourceId,
            @RequestParam(required = false)
            Instant from,
            @RequestParam(required = false)
            Instant to,
            @PageableDefault(
                    size = 20,
                    sort = "occurredAt"
            )
            Pageable pageable
    ) {
        return auditService.search(
                userId(jwt),
                actorUserId,
                action,
                resourceType,
                resourceId,
                from,
                to,
                pageable
        );
    }

    private UUID userId(
            Jwt jwt
    ) {
        return UUID.fromString(jwt.getSubject());
    }
}