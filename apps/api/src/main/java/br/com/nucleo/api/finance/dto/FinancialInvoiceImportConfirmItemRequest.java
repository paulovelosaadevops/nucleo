package br.com.nucleo.api.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record FinancialInvoiceImportConfirmItemRequest(
        @NotBlank String id,
        boolean included,
        @NotNull LocalDate date,
        @NotBlank String description,
        @NotNull BigDecimal amount,
        Integer installmentNumber,
        Integer totalInstallments,
        @NotNull FinancialInvoiceImportItemType type,
        UUID categoryId
) {
}
