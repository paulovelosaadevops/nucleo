package br.com.nucleo.api.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record FinancialInvoiceImportPreviewResponse(
        String token,
        UUID cardId,
        String cardName,
        UUID invoiceId,
        LocalDate referenceMonth,
        LocalDate closingDate,
        LocalDate dueDate,
        BigDecimal statementTotal,
        BigDecimal processedTotal,
        BigDecimal difference,
        String fileName,
        String fileHash,
        String fileType,
        String parserName,
        boolean sameFilePreviouslyImported,
        List<String> warnings,
        List<FinancialInvoiceImportPreviewItemResponse> items
) {
}
