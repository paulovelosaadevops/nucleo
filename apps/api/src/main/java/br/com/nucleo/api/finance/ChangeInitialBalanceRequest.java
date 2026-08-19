package br.com.nucleo.api.finance;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ChangeInitialBalanceRequest(

        @NotNull(message = "Informe o novo saldo inicial")
        @Digits(
                integer = 16,
                fraction = 2,
                message = "O saldo inicial deve ter até 16 inteiros e 2 decimais"
        )
        BigDecimal initialBalance
) {
}