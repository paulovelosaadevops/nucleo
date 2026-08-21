package br.com.nucleo.api.audit.repository;

import br.com.nucleo.api.audit.domain.AuditAction;
import br.com.nucleo.api.audit.domain.AuditEvent;
import br.com.nucleo.api.audit.domain.AuditResourceType;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditEventRepository
        extends JpaRepository<AuditEvent, UUID> {

    @Query(
            value = """
                    select event
                      from AuditEvent event
                      left join fetch event.actor actor
                     where event.family.id = :familyId
                       and (
                            :filterActor = false
                            or actor.id = :actorUserId
                       )
                       and (
                            :filterAction = false
                            or event.action = :action
                       )
                       and (
                            :filterResourceType = false
                            or event.resourceType = :resourceType
                       )
                       and (
                            :filterResourceId = false
                            or event.resourceId = :resourceId
                       )
                       and (
                            :filterFrom = false
                            or event.occurredAt >= :from
                       )
                       and (
                            :filterTo = false
                            or event.occurredAt <= :to
                       )
                    """,
            countQuery = """
                    select count(event)
                      from AuditEvent event
                      left join event.actor actor
                     where event.family.id = :familyId
                       and (
                            :filterActor = false
                            or actor.id = :actorUserId
                       )
                       and (
                            :filterAction = false
                            or event.action = :action
                       )
                       and (
                            :filterResourceType = false
                            or event.resourceType = :resourceType
                       )
                       and (
                            :filterResourceId = false
                            or event.resourceId = :resourceId
                       )
                       and (
                            :filterFrom = false
                            or event.occurredAt >= :from
                       )
                       and (
                            :filterTo = false
                            or event.occurredAt <= :to
                       )
                    """
    )
    Page<AuditEvent> search(
            @Param("familyId")
            UUID familyId,

            @Param("filterActor")
            boolean filterActor,

            @Param("actorUserId")
            UUID actorUserId,

            @Param("filterAction")
            boolean filterAction,

            @Param("action")
            AuditAction action,

            @Param("filterResourceType")
            boolean filterResourceType,

            @Param("resourceType")
            AuditResourceType resourceType,

            @Param("filterResourceId")
            boolean filterResourceId,

            @Param("resourceId")
            UUID resourceId,

            @Param("filterFrom")
            boolean filterFrom,

            @Param("from")
            Instant from,

            @Param("filterTo")
            boolean filterTo,

            @Param("to")
            Instant to,

            Pageable pageable
    );
}