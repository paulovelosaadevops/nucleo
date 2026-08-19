package br.com.nucleo.api.finance;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateFinancialBudgetRequest(

        @NotNull(message = "Informe a categoria")
        UUID categoryId,

        @NotNull(message = "Informe o mês de referência")
        LocalDate referenceMonth,

        @NotNull(message = "Informe o limite do orçamento")
        @DecimalMin(
                value = "0.01",
                message = "O limite deve ser maior que zero"
        )
        @Digits(
                integer = 16,
                fraction = 2,
                message = "O limite deve ter até 16 inteiros e 2 decimais"
        )
        BigDecimal limitAmount,

        @DecimalMin(
                value = "1.00",
                message = "O percentual de alerta mínimo é 1"
        )
        @DecimalMax(
                value = "100.00",
                message = "O percentual de alerta máximo é 100"
        )
        @Digits(
                integer = 3,
                fraction = 2,
                message = "O percentual deve ter até 2 casas decimais"
        )
        BigDecimal alertPercentage
) {
}