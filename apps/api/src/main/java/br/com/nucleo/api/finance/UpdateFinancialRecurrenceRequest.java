package br.com.nucleo.api.finance;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

public record UpdateFinancialRecurrenceRequest(

        @NotNull(message = "Informe a conta")
        UUID accountId,

        UUID categoryId,

        @NotNull(message = "Informe o tipo do lançamento")
        FinancialTransactionType type,

        @NotBlank(message = "Informe a descrição")
        @Size(
                max = 160,
                message = "A descrição deve ter no máximo 160 caracteres"
        )
        String description,

        @NotNull(message = "Informe o valor")
        @DecimalMin(
                value = "0.01",
                message = "O valor deve ser maior que zero"
        )
        @Digits(
                integer = 16,
                fraction = 2,
                message = "O valor deve ter até 16 inteiros e 2 decimais"
        )
        BigDecimal amount,

        FinancialPaymentMethod paymentMethod,

        @Size(
                max = 1000,
                message = "As observações devem ter no máximo 1000 caracteres"
        )
        String notes
) {
}