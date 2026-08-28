package br.com.nucleo.api.finance.service.invoiceimport;

import br.com.nucleo.api.finance.dto.FinancialInvoiceImportItemType;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ParsedInvoiceItem(
        LocalDate date,
        String description,
        BigDecimal amount,
        Integer installmentNumber,
        Integer totalInstallments,
        FinancialInvoiceImportItemType type
) {
}
