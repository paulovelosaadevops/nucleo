package br.com.nucleo.api.finance.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.nucleo.api.finance.domain.FinancialRecurrence;

public interface FinancialRecurrenceRepository
        extends JpaRepository<FinancialRecurrence, UUID> {

    @EntityGraph(attributePaths = {
            "family",
            "account",
            "creditCard",
            "category",
            "createdBy"
    })
    Optional<FinancialRecurrence> findByIdAndFamily_Id(
            UUID recurrenceId,
            UUID familyId
    );

    @EntityGraph(attributePaths = {
            "family",
            "account",
            "creditCard",
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
            "creditCard",
            "category",
            "createdBy"
    })
    List<FinancialRecurrence>
            findAllByFamily_IdAndActiveTrueAndNextGenerationDateLessThanEqualOrderByNextGenerationDateAsc(
                    UUID familyId,
                    LocalDate generationLimit
            );

    @EntityGraph(attributePaths = {
            "family",
            "account",
            "creditCard",
            "category",
            "createdBy"
    })
    List<FinancialRecurrence>
            findAllByActiveTrueAndNextGenerationDateLessThanEqualOrderByNextGenerationDateAsc(
                    LocalDate generationLimit
            );
}