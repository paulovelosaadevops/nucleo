package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialBudget;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialBudgetRepository
        extends JpaRepository<FinancialBudget, UUID> {

    @EntityGraph(attributePaths = {
            "family",
            "category"
    })
    Optional<FinancialBudget> findByIdAndFamily_Id(
            UUID budgetId,
            UUID familyId
    );

    @EntityGraph(attributePaths = "category")
    List<FinancialBudget>
            findAllByFamily_IdAndReferenceMonthOrderByCategory_NameAsc(
                    UUID familyId,
                    LocalDate referenceMonth
            );

    boolean existsByFamily_IdAndCategory_IdAndReferenceMonth(
            UUID familyId,
            UUID categoryId,
            LocalDate referenceMonth
    );

    boolean existsByFamily_IdAndCategory_IdAndReferenceMonthAndIdNot(
            UUID familyId,
            UUID categoryId,
            LocalDate referenceMonth,
            UUID budgetId
    );

    boolean existsByCategory_Id(UUID categoryId);
}