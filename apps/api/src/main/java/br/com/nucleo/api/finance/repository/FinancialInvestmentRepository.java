package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialInvestment;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FinancialInvestmentRepository extends JpaRepository<FinancialInvestment, UUID> {
    @EntityGraph(attributePaths = {"family", "createdBy"})
    List<FinancialInvestment> findAllByFamily_IdOrderByActiveDescNameAsc(UUID familyId);

    @EntityGraph(attributePaths = {"family", "createdBy"})
    Optional<FinancialInvestment> findByIdAndFamily_Id(UUID investmentId, UUID familyId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"family", "createdBy"})
    Optional<FinancialInvestment> findWithLockByIdAndFamily_Id(UUID investmentId, UUID familyId);

    @Query("""
            select coalesce(sum(investment.calculatedBalance), 0)
            from FinancialInvestment investment
            where investment.family.id = :familyId
              and investment.active = true
            """)
    BigDecimal calculateInvestedBalance(@Param("familyId") UUID familyId);
}
