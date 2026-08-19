package br.com.nucleo.api.finance;

import java.math.BigDecimal;
import java.util.UUID;

public record FinancialCategorySummaryResponse(
        UUID categoryId,
        String categoryName,
        String color,
        String icon,
        FinancialTransactionType type,
        long transactionCount,
        BigDecimal total,
        BigDecimal percentage
) {
}