package br.com.nucleo.api.agenda;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgendaEventRepository
        extends JpaRepository<AgendaEvent, UUID> {

    @EntityGraph(attributePaths = {
            "family",
            "assignedTo",
            "assignedTo.user",
            "createdBy"
    })
    Optional<AgendaEvent> findByIdAndFamily_Id(
            UUID eventId,
            UUID familyId
    );
}