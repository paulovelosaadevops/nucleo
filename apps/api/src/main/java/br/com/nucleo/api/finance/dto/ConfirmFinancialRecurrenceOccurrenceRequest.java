package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialPaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ConfirmFinancialRecurrenceOccurrenceRequest(
        @NotNull
        @DecimalMin("0.01")
        @Digits(integer = 16, fraction = 2)
        BigDecimal amount,
        @NotNull LocalDate chargedDate,
        UUID categoryId,
        UUID accountId,
        UUID creditCardId,
        FinancialPaymentMethod paymentMethod,
        @Size(max = 1000) String notes
) {
}
