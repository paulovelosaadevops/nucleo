package br.com.nucleo.api.finance.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record FinancialInvoiceCategorySummaryResponse(
        UUID categoryId,
        String categoryName,
        String color,
        BigDecimal amount,
        BigDecimal percentage,
        long itemCount,
        boolean uncategorized
) {
}
