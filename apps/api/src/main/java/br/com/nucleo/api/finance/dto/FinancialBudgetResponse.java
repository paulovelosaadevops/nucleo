package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialBudget;
import br.com.nucleo.api.finance.domain.FinancialBudgetStatus;
import br.com.nucleo.api.finance.domain.FinancialCategory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record FinancialBudgetResponse(
        UUID id,
        UUID categoryId,
        String categoryName,
        String categoryColor,
        String categoryIcon,
        LocalDate referenceMonth,
        BigDecimal limitAmount,
        BigDecimal paidAmount,
        BigDecimal pendingAmount,
        BigDecimal committedAmount,
        BigDecimal remainingAmount,
        BigDecimal consumptionPercentage,
        BigDecimal alertPercentage,
        FinancialBudgetStatus status,
        Instant createdAt,
        Instant updatedAt
) {

    public static FinancialBudgetResponse from(
            FinancialBudget budget,
            BigDecimal paidAmount,
            BigDecimal pendingAmount
    ) {
        BigDecimal paid = paidAmount == null
                ? BigDecimal.ZERO
                : paidAmount;

        BigDecimal pending = pendingAmount == null
                ? BigDecimal.ZERO
                : pendingAmount;

        BigDecimal committed = paid.add(pending);

        BigDecimal remaining = budget
                .getLimitAmount()
                .subtract(committed);

        BigDecimal percentage = committed
                .multiply(BigDecimal.valueOf(100))
                .divide(
                        budget.getLimitAmount(),
                        2,
                        RoundingMode.HALF_UP
                );

        FinancialBudgetStatus status;

        if (
                committed.compareTo(
                        budget.getLimitAmount()
                ) > 0
        ) {
            status = FinancialBudgetStatus.EXCEEDED;
        } else if (
                percentage.compareTo(
                        budget.getAlertPercentage()
                ) >= 0
        ) {
            status = FinancialBudgetStatus.ALERT;
        } else {
            status = FinancialBudgetStatus.SAFE;
        }

        FinancialCategory category = budget.getCategory();

        return new FinancialBudgetResponse(
                budget.getId(),
                category.getId(),
                category.getName(),
                category.getColor(),
                category.getIcon(),
                budget.getReferenceMonth(),
                budget.getLimitAmount(),
                paid,
                pending,
                committed,
                remaining,
                percentage,
                budget.getAlertPercentage(),
                status,
                budget.getCreatedAt(),
                budget.getUpdatedAt()
        );
    }
}