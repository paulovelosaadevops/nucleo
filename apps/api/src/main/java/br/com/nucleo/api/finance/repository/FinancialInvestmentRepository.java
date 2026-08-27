package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialInvestment;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FinancialInvestmentRepository extends JpaRepository<FinancialInvestment, UUID> {
    @EntityGraph(attributePaths = {"family", "account", "createdBy"})
    List<FinancialInvestment> findAllByFamily_IdOrderByActiveDescNameAsc(UUID familyId);

    @EntityGraph(attributePaths = {"family", "account", "createdBy"})
    Optional<FinancialInvestment> findByIdAndFamily_Id(UUID investmentId, UUID familyId);

    boolean existsByAccount_Id(UUID accountId);

    @Query("""
            select coalesce(sum(investment.calculatedBalance), 0)
            from FinancialInvestment investment
            where investment.family.id = :familyId
              and investment.active = true
            """)
    BigDecimal calculateInvestedBalance(@Param("familyId") UUID familyId);
}
