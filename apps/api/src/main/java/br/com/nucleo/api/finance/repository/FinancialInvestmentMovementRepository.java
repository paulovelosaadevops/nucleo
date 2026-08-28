package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialInvestmentMovement;
import br.com.nucleo.api.finance.domain.FinancialInvestmentMovementType;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialInvestmentMovementRepository extends JpaRepository<FinancialInvestmentMovement, UUID> {
    List<FinancialInvestmentMovement> findAllByInvestment_IdOrderByMovementDateDescCreatedAtDesc(UUID investmentId);
    boolean existsByIdempotencyKey(String idempotencyKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<FinancialInvestmentMovement> findFirstByInvestment_IdAndMovementTypeAndMovementDate(
            UUID investmentId,
            FinancialInvestmentMovementType movementType,
            LocalDate movementDate
    );
}
