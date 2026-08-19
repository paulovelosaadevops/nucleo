package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialCreditCardBrand;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateFinancialCreditCardRequest(

        @NotBlank(message = "Informe o nome do cartão")
        @Size(
                min = 2,
                max = 120,
                message = "O nome deve ter entre 2 e 120 caracteres"
        )
        String name,

        @NotNull(message = "Informe a bandeira")
        FinancialCreditCardBrand brand,

        @Pattern(
                regexp = "^$|^[0-9]{4}$",
                message = "Informe exatamente os quatro últimos dígitos"
        )
        String lastFour,

        @NotNull(message = "Informe o limite")
        @DecimalMin(
                value = "0.01",
                message = "O limite deve ser maior que zero"
        )
        @Digits(integer = 16, fraction = 2)
        BigDecimal creditLimit,

        @Min(value = 1, message = "O dia de fechamento mínimo é 1")
        @Max(value = 28, message = "O dia de fechamento máximo é 28")
        int closingDay,

        @Min(value = 1, message = "O dia de vencimento mínimo é 1")
        @Max(value = 28, message = "O dia de vencimento máximo é 28")
        int dueDay,

        UUID paymentAccountId,

        @Pattern(
                regexp = "^$|^#[0-9A-Fa-f]{6}$",
                message = "Informe uma cor hexadecimal válida"
        )
        String color
) {
}