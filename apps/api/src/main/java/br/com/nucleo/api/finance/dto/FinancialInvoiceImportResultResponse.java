package br.com.nucleo.api.finance.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record FinancialInvoiceImportResultResponse(
        UUID importId,
        UUID invoiceId,
        int importedCount,
        int ignoredCount,
        int duplicatedCount,
        BigDecimal importedTotal,
        BigDecimal difference
) {
}
