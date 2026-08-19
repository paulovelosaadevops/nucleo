package br.com.nucleo.api.finance;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FinancialAccountResponse(
        UUID id,
        String name,
        FinancialAccountType type,
        BigDecimal initialBalance,
        BigDecimal paidMovementBalance,
        BigDecimal currentBalance,
        String color,
        boolean includeInTotal,
        boolean active,
        UUID createdByUserId,
        String createdByName,
        Instant createdAt,
        Instant updatedAt
) {

    public static FinancialAccountResponse from(
            FinancialAccount account,
            BigDecimal paidMovementBalance
    ) {
        BigDecimal movements = paidMovementBalance == null
                ? BigDecimal.ZERO
                : paidMovementBalance;

        BigDecimal currentBalance = account
                .getInitialBalance()
                .add(movements);

        return new FinancialAccountResponse(
                account.getId(),
                account.getName(),
                account.getType(),
                account.getInitialBalance(),
                movements,
                currentBalance,
                account.getColor(),
                account.isIncludeInTotal(),
                account.isActive(),
                account.getCreatedBy().getId(),
                account.getCreatedBy().getName(),
                account.getCreatedAt(),
                account.getUpdatedAt()
        );
    }
}