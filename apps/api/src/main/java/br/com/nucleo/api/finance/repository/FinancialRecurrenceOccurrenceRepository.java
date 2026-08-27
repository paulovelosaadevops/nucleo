package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialRecurrenceOccurrence;
import br.com.nucleo.api.finance.domain.FinancialRecurrenceOccurrenceStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialRecurrenceOccurrenceRepository
        extends JpaRepository<FinancialRecurrenceOccurrence, UUID> {

    boolean existsByRecurrence_IdAndReferenceMonth(UUID recurrenceId, LocalDate referenceMonth);

    @EntityGraph(attributePaths = {
            "recurrence", "category", "account", "creditCard", "transaction", "purchase", "confirmedBy"
    })
    Optional<FinancialRecurrenceOccurrence> findByIdAndFamily_Id(UUID id, UUID familyId);

    @EntityGraph(attributePaths = {
            "recurrence", "category", "account", "creditCard", "confirmedBy"
    })
    List<FinancialRecurrenceOccurrence> findAllByFamily_IdOrderByScheduledDateDescCreatedAtDesc(UUID familyId);

    @EntityGraph(attributePaths = {
            "recurrence", "category", "account", "creditCard"
    })
    List<FinancialRecurrenceOccurrence> findAllByFamily_IdAndStatusInOrderByScheduledDateAsc(
            UUID familyId,
            List<FinancialRecurrenceOccurrenceStatus> statuses
    );

    long countByCreditCard_IdAndReferenceMonthAndStatus(
            UUID creditCardId,
            LocalDate referenceMonth,
            FinancialRecurrenceOccurrenceStatus status
    );
}
