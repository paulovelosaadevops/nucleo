package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialCategory;
import br.com.nucleo.api.finance.domain.FinancialCategoryType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialCategoryRepository
        extends JpaRepository<FinancialCategory, UUID> {

    @EntityGraph(attributePaths = "family")
    Optional<FinancialCategory> findByIdAndFamily_Id(
            UUID categoryId,
            UUID familyId
    );

    @EntityGraph(attributePaths = "family")
    List<FinancialCategory>
            findAllByFamily_IdOrderByTypeAscNameAsc(
                    UUID familyId
            );

    @EntityGraph(attributePaths = "family")
    List<FinancialCategory>
            findAllByFamily_IdAndTypeOrderByNameAsc(
                    UUID familyId,
                    FinancialCategoryType type
            );

    boolean existsByFamily_IdAndTypeAndNameIgnoreCase(
            UUID familyId,
            FinancialCategoryType type,
            String name
    );

    boolean existsByFamily_IdAndTypeAndNameIgnoreCaseAndIdNot(
            UUID familyId,
            FinancialCategoryType type,
            String name,
            UUID categoryId
    );
}