package br.com.nucleo.api.audit.service;

import br.com.nucleo.api.audit.domain.AuditAction;
import br.com.nucleo.api.audit.domain.AuditEvent;
import br.com.nucleo.api.audit.domain.AuditResourceType;
import br.com.nucleo.api.audit.dto.AuditEventResponse;
import br.com.nucleo.api.audit.repository.AuditEventRepository;
import br.com.nucleo.api.family.domain.Family;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.identity.user.domain.User;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Service
public class AuditService {

    private static final int MAXIMUM_PAGE_SIZE = 100;

    private final FamilyAccessService familyAccessService;
    private final AuditEventRepository auditEventRepository;
    private final JsonMapper objectMapper;

    public AuditService(
            FamilyAccessService familyAccessService,
            AuditEventRepository auditEventRepository,
            JsonMapper objectMapper
    ) {
        this.familyAccessService = familyAccessService;
        this.auditEventRepository = auditEventRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public Page<AuditEventResponse> search(
            UUID currentUserId,
            UUID actorUserId,
            AuditAction action,
            AuditResourceType resourceType,
            UUID resourceId,
            Instant from,
            Instant to,
            Pageable pageable
    ) {
        FamilyMembership administrator =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        validatePeriod(from, to);
        validatePageable(pageable);

        boolean filterActor =
                actorUserId != null;

        boolean filterAction =
                action != null;

        boolean filterResourceType =
                resourceType != null;

        boolean filterResourceId =
                resourceId != null;

        boolean filterFrom =
                from != null;

        boolean filterTo =
                to != null;

        return auditEventRepository.search(
                administrator.getFamily().getId(),
                filterActor,
                actorUserId,
                filterAction,
                action,
                filterResourceType,
                resourceType,
                filterResourceId,
                resourceId,
                filterFrom,
                from,
                filterTo,
                to,
                pageable
        ).map(AuditEventResponse::from);
    }

    @Transactional
    public AuditEvent record(
            Family family,
            User actor,
            AuditAction action,
            AuditResourceType resourceType,
            UUID resourceId,
            String description
    ) {
        return record(
                family,
                actor,
                action,
                resourceType,
                resourceId,
                description,
                null
        );
    }

    @Transactional
    public AuditEvent record(
            Family family,
            User actor,
            AuditAction action,
            AuditResourceType resourceType,
            UUID resourceId,
            String description,
            Map<String, ?> metadata
    ) {
        RequestInformation requestInformation =
                resolveRequestInformation();

        AuditEvent event = AuditEvent.create(
                family,
                actor,
                action,
                resourceType,
                resourceId,
                description,
                serializeMetadata(metadata),
                requestInformation.ipAddress(),
                requestInformation.userAgent()
        );

        return auditEventRepository.save(event);
    }

    private String serializeMetadata(
            Map<String, ?> metadata
    ) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JacksonException exception) {
            throw new IllegalArgumentException(
                    "Não foi possível serializar os dados da auditoria",
                    exception
            );
        }
    }

    private RequestInformation resolveRequestInformation() {
        if (
                !(RequestContextHolder.getRequestAttributes()
                        instanceof ServletRequestAttributes attributes)
        ) {
            return new RequestInformation(
                    null,
                    null
            );
        }

        HttpServletRequest request =
                attributes.getRequest();

        return new RequestInformation(
                normalizeOptional(
                        request.getRemoteAddr(),
                        64
                ),
                normalizeOptional(
                        request.getHeader(
                                "User-Agent"
                        ),
                        500
                )
        );
    }

    private String normalizeOptional(
            String value,
            int maximumLength
    ) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized =
                value.trim();

        if (normalized.length() > maximumLength) {
            return normalized.substring(
                    0,
                    maximumLength
            );
        }

        return normalized;
    }

    private void validatePeriod(
            Instant from,
            Instant to
    ) {
        if (
                from != null
                        && to != null
                        && to.isBefore(from)
        ) {
            throw new IllegalArgumentException(
                    "O final do período não pode ser anterior ao início"
            );
        }
    }

    private void validatePageable(
            Pageable pageable
    ) {
        if (pageable.getPageNumber() < 0) {
            throw new IllegalArgumentException(
                    "A página não pode ser negativa"
            );
        }

        if (
                pageable.getPageSize() < 1
                        || pageable.getPageSize()
                        > MAXIMUM_PAGE_SIZE
        ) {
            throw new IllegalArgumentException(
                    "A quantidade por página deve ficar entre 1 e 100"
            );
        }
    }

    private record RequestInformation(
            String ipAddress,
            String userAgent
    ) {
    }
}