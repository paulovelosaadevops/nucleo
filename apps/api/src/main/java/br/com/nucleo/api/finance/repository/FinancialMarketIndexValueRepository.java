package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialMarketIndexValue;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialMarketIndexValueRepository extends JpaRepository<FinancialMarketIndexValue, UUID> {
    Optional<FinancialMarketIndexValue> findFirstByMarketIndex_CodeAndReferenceDateLessThanEqualOrderByReferenceDateDesc(String code, LocalDate referenceDate);
    boolean existsByMarketIndex_IdAndReferenceDateAndSource(UUID marketIndexId, LocalDate referenceDate, String source);
}
