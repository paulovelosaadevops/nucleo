package br.com.nucleo.api.agenda;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgendaReminderRepository
        extends JpaRepository<AgendaReminder, UUID> {

    List<AgendaReminder> findAllByEvent_IdOrderByMinutesBeforeAsc(
            UUID eventId
    );
}