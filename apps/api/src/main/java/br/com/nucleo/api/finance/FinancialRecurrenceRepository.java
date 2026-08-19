package br.com.nucleo.api.finance;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialRecurrenceRepository
        extends JpaRepository<FinancialRecurrence, UUID> {

    @EntityGraph(attributePaths = {
            "family",
            "account",
            "category",
            "createdBy"
    })
    Optional<FinancialRecurrence> findByIdAndFamily_Id(
            UUID recurrenceId,
            UUID familyId
    );

    @EntityGraph(attributePaths = {
            "account",
            "category",
            "createdBy"
    })
    List<FinancialRecurrence>
            findAllByFamily_IdOrderByActiveDescCreatedAtDesc(
                    UUID familyId
            );

    @EntityGraph(attributePaths = {
            "family",
            "account",
            "category",
            "createdBy"
    })
    List<FinancialRecurrence>
            findAllByFamily_IdAndActiveTrueAndNextGenerationDateLessThanEqualOrderByNextGenerationDateAsc(
                    UUID familyId,
                    LocalDate generationLimit
            );
}