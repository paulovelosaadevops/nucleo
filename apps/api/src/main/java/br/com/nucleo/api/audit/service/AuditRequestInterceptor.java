package br.com.nucleo.api.audit.service;

import br.com.nucleo.api.audit.domain.AuditAction;
import br.com.nucleo.api.audit.domain.AuditResourceType;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.service.FamilyAccessService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuditRequestInterceptor
        implements HandlerInterceptor {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(
                    AuditRequestInterceptor.class
            );

    private final FamilyAccessService familyAccessService;
    private final AuditService auditService;

    public AuditRequestInterceptor(
            FamilyAccessService familyAccessService,
            AuditService auditService
    ) {
        this.familyAccessService = familyAccessService;
        this.auditService = auditService;
    }

    @Override
    public void afterCompletion(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            Exception exception
    ) {
        if (!shouldAudit(request, response, exception)) {
            return;
        }

        UUID currentUserId = authenticatedUserId();

        if (currentUserId == null) {
            return;
        }

        try {
            FamilyMembership membership =
                    familyAccessService
                            .requireActiveMembership(
                                    currentUserId
                            );

            String path = request.getRequestURI();
            AuditAction action = resolveAction(
                    request.getMethod(),
                    path
            );

            AuditResourceType resourceType =
                    resolveResourceType(path);

            UUID resourceId =
                    extractLastUuid(path);

            auditService.record(
                    membership.getFamily(),
                    membership.getUser(),
                    action,
                    resourceType,
                    resourceId,
                    buildDescription(
                            action,
                            resourceType
                    ),
                    Map.of(
                            "httpMethod",
                            request.getMethod(),
                            "requestPath",
                            path,
                            "responseStatus",
                            response.getStatus()
                    )
            );
        } catch (RuntimeException auditException) {
            LOGGER.error(
                    "Não foi possível registrar o evento de auditoria para {} {}",
                    request.getMethod(),
                    request.getRequestURI(),
                    auditException
            );
        }
    }

    private boolean shouldAudit(
            HttpServletRequest request,
            HttpServletResponse response,
            Exception exception
    ) {
        if (exception != null) {
            return false;
        }

        if (response.getStatus() >= 400) {
            return false;
        }

        String method = request
                .getMethod()
                .toUpperCase(Locale.ROOT);

        if (
                method.equals("GET")
                        || method.equals("HEAD")
                        || method.equals("OPTIONS")
        ) {
            return false;
        }

        String path = request.getRequestURI();

        return path.startsWith("/api/")
                && !path.startsWith("/api/auth/")
                && !path.startsWith("/api/audit-events");
    }

    private UUID authenticatedUserId() {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (
                !(authentication
                        instanceof JwtAuthenticationToken jwt)
        ) {
            return null;
        }

        try {
            return UUID.fromString(
                    jwt.getToken().getSubject()
            );
        } catch (IllegalArgumentException exception) {
            LOGGER.warn(
                    "JWT autenticado possui subject inválido"
            );

            return null;
        }
    }

    private AuditAction resolveAction(
            String httpMethod,
            String path
    ) {
        String normalizedPath =
                path.toLowerCase(Locale.ROOT);

        if (
                httpMethod.equalsIgnoreCase("DELETE")
                        && normalizedPath.endsWith(
                        "/payment"
                )
        ) {
            return AuditAction.REVERSE_PAYMENT;
        }

        if (normalizedPath.contains("/read-all")) {
            return AuditAction.MARK_ALL_AS_READ;
        }

        if (normalizedPath.endsWith("/unread")) {
            return AuditAction.MARK_AS_UNREAD;
        }

        if (normalizedPath.endsWith("/read")) {
            return AuditAction.MARK_AS_READ;
        }

        if (
                normalizedPath.endsWith("/pay")
                        || normalizedPath.endsWith(
                        "/paid"
                )
        ) {
            return AuditAction.MARK_AS_PAID;
        }

        if (normalizedPath.endsWith("/pending")) {
            return AuditAction.MARK_AS_PENDING;
        }

        if (normalizedPath.endsWith("/complete")) {
            return AuditAction.COMPLETE;
        }

        if (normalizedPath.endsWith("/close")) {
            return AuditAction.CLOSE;
        }

        if (normalizedPath.endsWith("/reopen")) {
            return AuditAction.REOPEN;
        }

        if (normalizedPath.endsWith("/cancel")) {
            return AuditAction.CANCEL;
        }

        if (normalizedPath.endsWith("/restore")) {
            return AuditAction.RESTORE;
        }

        if (normalizedPath.endsWith("/activate")) {
            return AuditAction.ACTIVATE;
        }

        if (
                normalizedPath.endsWith("/deactivate")
                        || normalizedPath.endsWith(
                        "/archive"
                )
        ) {
            return AuditAction.DEACTIVATE;
        }

        if (
                normalizedPath.contains("/invitations")
                        && httpMethod.equalsIgnoreCase("POST")
        ) {
            return AuditAction.INVITE;
        }

        if (normalizedPath.endsWith("/revoke")) {
            return AuditAction.REVOKE_INVITATION;
        }

        if (normalizedPath.endsWith("/accept")) {
            return AuditAction.ACCEPT_INVITATION;
        }

        if (normalizedPath.endsWith("/decline")) {
            return AuditAction.DECLINE_INVITATION;
        }

        if (httpMethod.equalsIgnoreCase("POST")) {
            return AuditAction.CREATE;
        }

        if (
                httpMethod.equalsIgnoreCase("PUT")
                        || httpMethod.equalsIgnoreCase("PATCH")
        ) {
            return AuditAction.UPDATE;
        }

        if (httpMethod.equalsIgnoreCase("DELETE")) {
            return AuditAction.DELETE;
        }

        return AuditAction.UPDATE;
    }

    private AuditResourceType resolveResourceType(
            String path
    ) {
        String normalized =
                path.toLowerCase(Locale.ROOT);

        if (normalized.contains("/notifications")) {
            if (
                    normalized.contains(
                            "notification-preferences"
                    )
            ) {
                return AuditResourceType
                        .NOTIFICATION_PREFERENCE;
            }

            return AuditResourceType.NOTIFICATION;
        }

        if (normalized.contains("/agenda/occurrences")) {
            return AuditResourceType.AGENDA_OCCURRENCE;
        }

        if (normalized.contains("/agenda")) {
            return AuditResourceType.AGENDA_EVENT;
        }

        if (
                normalized.contains("/shopping")
                        && normalized.contains("/items")
        ) {
            return AuditResourceType.SHOPPING_ITEM;
        }

        if (normalized.contains("/shopping")) {
            return AuditResourceType.SHOPPING_LIST;
        }

        if (
                normalized.contains(
                        "/credit-card-invoices"
                )
        ) {
            return AuditResourceType
                    .FINANCIAL_CREDIT_CARD_INVOICE;
        }

        if (
                normalized.contains(
                        "/credit-card-purchases"
                )
        ) {
            return AuditResourceType
                    .FINANCIAL_CREDIT_CARD_PURCHASE;
        }

        if (
                normalized.contains("/credit-cards")
        ) {
            return AuditResourceType
                    .FINANCIAL_CREDIT_CARD;
        }

        if (normalized.contains("/budgets")) {
            return AuditResourceType.FINANCIAL_BUDGET;
        }

        if (normalized.contains("/recurrences")) {
            return AuditResourceType
                    .FINANCIAL_RECURRENCE;
        }

        if (
                normalized.contains(
                        "/finance/transactions"
                )
        ) {
            return AuditResourceType
                    .FINANCIAL_TRANSACTION;
        }

        if (
                normalized.contains(
                        "/finance/categories"
                )
        ) {
            return AuditResourceType
                    .FINANCIAL_CATEGORY;
        }

        if (
                normalized.contains(
                        "/finance/accounts"
                )
        ) {
            return AuditResourceType
                    .FINANCIAL_ACCOUNT;
        }

        if (normalized.contains("/invitations")) {
            return AuditResourceType.FAMILY_INVITATION;
        }

        if (
                normalized.contains("/family/members")
                        || normalized.contains(
                        "/family-members"
                )
        ) {
            return AuditResourceType
                    .FAMILY_MEMBERSHIP;
        }

        if (normalized.contains("/family")) {
            return AuditResourceType.FAMILY;
        }

        if (normalized.contains("/users")) {
            return AuditResourceType.USER;
        }

        return AuditResourceType.SYSTEM;
    }

    private UUID extractLastUuid(
            String path
    ) {
        UUID result = null;

        for (String segment : path.split("/")) {
            try {
                result = UUID.fromString(segment);
            } catch (IllegalArgumentException ignored) {
                // O segmento não é um UUID.
            }
        }

        return result;
    }

    private String buildDescription(
            AuditAction action,
            AuditResourceType resourceType
    ) {
        return "Ação "
                + action.name()
                + " realizada sobre "
                + resourceType.name();
    }
}