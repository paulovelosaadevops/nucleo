package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialInvestmentYieldEntry;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialInvestmentYieldEntryRepository extends JpaRepository<FinancialInvestmentYieldEntry, UUID> {
    boolean existsByLot_IdAndReferenceDate(UUID lotId, LocalDate referenceDate);
}
