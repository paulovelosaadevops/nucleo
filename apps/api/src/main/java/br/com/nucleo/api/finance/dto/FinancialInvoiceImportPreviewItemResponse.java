package br.com.nucleo.api.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record FinancialInvoiceImportPreviewItemResponse(
        String id,
        boolean included,
        LocalDate date,
        String description,
        BigDecimal amount,
        Integer installmentNumber,
        Integer totalInstallments,
        FinancialInvoiceImportItemType type,
        UUID suggestedCategoryId,
        String suggestedCategoryName,
        FinancialInvoiceImportItemStatus status,
        String fingerprint,
        List<String> problems
) {
}
