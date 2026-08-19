package br.com.nucleo.api.agenda.service;

import br.com.nucleo.api.agenda.domain.AgendaOccurrence;
import br.com.nucleo.api.agenda.domain.OccurrenceStatus;
import br.com.nucleo.api.agenda.dto.AgendaOccurrenceActionRequest;
import br.com.nucleo.api.agenda.repository.AgendaOccurrenceRepository;
import br.com.nucleo.api.family.service.FamilyAccessService;

import br.com.nucleo.api.common.error.AgendaConflictException;
import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.family.domain.FamilyMembership;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgendaOccurrenceActionService {

    private final FamilyAccessService familyAccessService;
    private final AgendaOccurrenceRepository occurrenceRepository;

    public AgendaOccurrenceActionService(
            FamilyAccessService familyAccessService,
            AgendaOccurrenceRepository occurrenceRepository
    ) {
        this.familyAccessService = familyAccessService;
        this.occurrenceRepository = occurrenceRepository;
    }

    @Transactional
    public void complete(
            UUID currentUserId,
            UUID occurrenceId,
            AgendaOccurrenceActionRequest request
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        AgendaOccurrence occurrence = findOccurrence(
                occurrenceId,
                currentMembership
        );

        requireScheduled(occurrence);

        occurrence.complete(
                currentMembership.getUser(),
                request.notes()
        );
    }

    @Transactional
    public void cancel(
            UUID currentUserId,
            UUID occurrenceId,
            AgendaOccurrenceActionRequest request
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        AgendaOccurrence occurrence = findOccurrence(
                occurrenceId,
                currentMembership
        );

        requireScheduled(occurrence);

        occurrence.cancel(
                currentMembership.getUser(),
                request.notes()
        );
    }

    private AgendaOccurrence findOccurrence(
            UUID occurrenceId,
            FamilyMembership currentMembership
    ) {
        return occurrenceRepository
                .findByIdAndEvent_Family_Id(
                        occurrenceId,
                        currentMembership.getFamily().getId()
                )
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Compromisso não encontrado"
                ));
    }

    private void requireScheduled(
            AgendaOccurrence occurrence
    ) {
        if (
                occurrence.getStatus()
                        != OccurrenceStatus.SCHEDULED
        ) {
            throw new AgendaConflictException(
                    "Este compromisso já foi concluído ou cancelado"
            );
        }
    }
}