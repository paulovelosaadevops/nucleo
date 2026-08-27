package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialInvestmentMovement;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialInvestmentMovementRepository extends JpaRepository<FinancialInvestmentMovement, UUID> {
    List<FinancialInvestmentMovement> findAllByInvestment_IdOrderByMovementDateDescCreatedAtDesc(UUID investmentId);
    boolean existsByIdempotencyKey(String idempotencyKey);
}
