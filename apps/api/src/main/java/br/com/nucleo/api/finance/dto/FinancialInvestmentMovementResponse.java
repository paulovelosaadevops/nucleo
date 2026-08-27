package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialInvestmentMovement;
import br.com.nucleo.api.finance.domain.FinancialInvestmentMovementType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record FinancialInvestmentMovementResponse(
        UUID id,
        FinancialInvestmentMovementType movementType,
        LocalDate movementDate,
        BigDecimal amount,
        BigDecimal balanceAfter,
        String notes
) {
    public static FinancialInvestmentMovementResponse from(
            FinancialInvestmentMovement movement
    ) {
        return new FinancialInvestmentMovementResponse(
                movement.getId(),
                movement.getMovementType(),
                movement.getMovementDate(),
                movement.getAmount(),
                movement.getCalculatedBalanceAfter(),
                movement.getNotes()
        );
    }
}
