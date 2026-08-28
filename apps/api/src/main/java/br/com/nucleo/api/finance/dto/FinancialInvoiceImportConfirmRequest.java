package br.com.nucleo.api.finance.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record FinancialInvoiceImportConfirmRequest(
        boolean acceptDifference,
        @NotNull List<@Valid FinancialInvoiceImportConfirmItemRequest> items
) {
}
