package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialInvoiceImport;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FinancialInvoiceImportResponse(
        UUID id,
        UUID cardId,
        String cardName,
        UUID invoiceId,
        String originalFileName,
        String fileHash,
        String fileType,
        String parserName,
        String status,
        int foundCount,
        int importedCount,
        int ignoredCount,
        int duplicatedCount,
        BigDecimal statementTotal,
        BigDecimal importedTotal,
        BigDecimal difference,
        boolean warningAccepted,
        String createdByName,
        Instant createdAt,
        String errorMessage
) {
    public static FinancialInvoiceImportResponse from(
            FinancialInvoiceImport item
    ) {
        return new FinancialInvoiceImportResponse(
                item.getId(),
                item.getCard().getId(),
                item.getCard().getName(),
                item.getInvoice() == null ? null : item.getInvoice().getId(),
                item.getOriginalFileName(),
                item.getFileHash(),
                item.getFileType().name(),
                item.getParserName(),
                item.getStatus().name(),
                item.getFoundCount(),
                item.getImportedCount(),
                item.getIgnoredCount(),
                item.getDuplicatedCount(),
                item.getStatementTotal(),
                item.getImportedTotal(),
                item.getDifference(),
                item.isWarningAccepted(),
                item.getCreatedBy().getName(),
                item.getCreatedAt(),
                item.getErrorMessage()
        );
    }
}
