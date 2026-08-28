package br.com.nucleo.api.finance.dto;

import java.util.UUID;

public record FinancialInvoiceImportRollbackResponse(
        UUID importId,
        int removedCount
) {
}
