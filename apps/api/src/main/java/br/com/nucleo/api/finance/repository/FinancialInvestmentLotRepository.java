package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialInvestmentLot;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialInvestmentLotRepository extends JpaRepository<FinancialInvestmentLot, UUID> {
    List<FinancialInvestmentLot> findAllByInvestment_IdAndActiveTrueOrderByContributionDateAscCreatedAtAsc(UUID investmentId);
}
