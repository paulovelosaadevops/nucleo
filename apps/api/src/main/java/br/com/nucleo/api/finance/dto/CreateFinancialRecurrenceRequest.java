package br.com.nucleo.api.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import br.com.nucleo.api.finance.domain.FinancialPaymentMethod;
import br.com.nucleo.api.finance.domain.FinancialRecurrenceFrequency;
import br.com.nucleo.api.finance.domain.FinancialTransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateFinancialRecurrenceRequest(

        UUID accountId,

        UUID creditCardId,

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

        @NotNull(message = "Informe a frequência")
        FinancialRecurrenceFrequency frequency,

        @Min(
                value = 1,
                message = "O intervalo mínimo é 1"
        )
        @Max(
                value = 365,
                message = "O intervalo máximo é 365"
        )
        Integer interval,

        @NotNull(message = "Informe a data inicial")
        LocalDate startDate,

        LocalDate endDate,

        @Min(
                value = 1,
                message = "A quantidade de ocorrências deve ser maior que zero"
        )
        @Max(
                value = 600,
                message = "A quantidade máxima é de 600 ocorrências"
        )
        Integer occurrenceCount,

        FinancialPaymentMethod paymentMethod,

        @Size(
                max = 1000,
                message = "As observações devem ter no máximo 1000 caracteres"
        )
        String notes
) {
}