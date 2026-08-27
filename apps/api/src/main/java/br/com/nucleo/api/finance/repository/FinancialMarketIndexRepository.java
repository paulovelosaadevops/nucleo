package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialMarketIndex;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialMarketIndexRepository extends JpaRepository<FinancialMarketIndex, UUID> {
    Optional<FinancialMarketIndex> findByCodeAndSource(String code, String source);
}
