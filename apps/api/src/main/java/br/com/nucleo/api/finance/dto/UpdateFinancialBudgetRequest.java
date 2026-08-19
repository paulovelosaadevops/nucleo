package br.com.nucleo.api.finance.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdateFinancialBudgetRequest(

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

        @NotNull(message = "Informe o percentual de alerta")
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