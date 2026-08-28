package br.com.nucleo.api.finance.service.invoiceimport;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ParsedInvoice(
        String parserName,
        String institutionName,
        String holderName,
        LocalDate closingDate,
        LocalDate dueDate,
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal statementTotal,
        int ignoredPaymentCount,
        List<ParsedInvoiceItem> items,
        List<String> warnings
) {
}
