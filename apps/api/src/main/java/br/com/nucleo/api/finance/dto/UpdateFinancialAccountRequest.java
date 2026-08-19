package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialAccountType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateFinancialAccountRequest(

        @NotBlank(message = "Informe o nome da conta")
        @Size(
                min = 2,
                max = 120,
                message = "O nome da conta deve ter entre 2 e 120 caracteres"
        )
        String name,

        @NotNull(message = "Informe o tipo da conta")
        FinancialAccountType type,

        @Size(
                max = 20,
                message = "A cor deve ter no máximo 20 caracteres"
        )
        @Pattern(
                regexp = "^$|^#[0-9A-Fa-f]{6}$",
                message = "Informe uma cor hexadecimal válida"
        )
        String color,

        @NotNull(
                message = "Informe se a conta entra no total"
        )
        Boolean includeInTotal
) {
}