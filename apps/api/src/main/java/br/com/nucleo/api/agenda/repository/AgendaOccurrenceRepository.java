package br.com.nucleo.api.agenda.repository;

import br.com.nucleo.api.agenda.domain.AgendaOccurrence;
import br.com.nucleo.api.agenda.domain.OccurrenceStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AgendaOccurrenceRepository
        extends JpaRepository<AgendaOccurrence, UUID> {

    @EntityGraph(attributePaths = {
            "event",
            "event.family",
            "event.assignedTo",
            "event.assignedTo.user",
            "event.createdBy",
            "statusChangedBy"
    })
    Optional<AgendaOccurrence> findByIdAndEvent_Family_Id(
            UUID occurrenceId,
            UUID familyId
    );

    @EntityGraph(attributePaths = {
            "event",
            "event.family",
            "event.assignedTo",
            "event.assignedTo.user",
            "event.createdBy",
            "statusChangedBy"
    })
    @Query("""
            select occurrence
              from AgendaOccurrence occurrence
             where occurrence.event.family.id = :familyId
               and occurrence.occurrenceStartsAt < :periodEnd
               and (
                    (
                        occurrence.occurrenceEndsAt is null
                        and occurrence.occurrenceStartsAt >= :periodStart
                    )
                    or
                    (
                        occurrence.occurrenceEndsAt is not null
                        and occurrence.occurrenceEndsAt > :periodStart
                    )
               )
             order by occurrence.occurrenceStartsAt asc
            """)
    List<AgendaOccurrence> findAllInPeriod(
            @Param("familyId") UUID familyId,
            @Param("periodStart") Instant periodStart,
            @Param("periodEnd") Instant periodEnd
    );

    @EntityGraph(attributePaths = {
            "event",
            "event.family",
            "event.assignedTo",
            "event.assignedTo.user",
            "event.createdBy"
    })
    @Query("""
            select occurrence
              from AgendaOccurrence occurrence
             where occurrence.status = :status
               and occurrence.occurrenceStartsAt
                   between :periodStart and :periodEnd
             order by occurrence.occurrenceStartsAt asc
            """)
    List<AgendaOccurrence> findAllScheduledForNotifications(
            @Param("status") OccurrenceStatus status,
            @Param("periodStart") Instant periodStart,
            @Param("periodEnd") Instant periodEnd
    );

    List<AgendaOccurrence>
            findAllByEvent_IdOrderByOccurrenceStartsAtAsc(
                    UUID eventId
            );
}