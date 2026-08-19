package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialCategoryType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateFinancialCategoryRequest(

        @NotBlank(message = "Informe o nome da categoria")
        @Size(
                min = 2,
                max = 80,
                message = "O nome da categoria deve ter entre 2 e 80 caracteres"
        )
        String name,

        @NotNull(message = "Informe o tipo da categoria")
        FinancialCategoryType type,

        @Size(
                max = 20,
                message = "A cor deve ter no máximo 20 caracteres"
        )
        @Pattern(
                regexp = "^$|^#[0-9A-Fa-f]{6}$",
                message = "Informe uma cor hexadecimal válida"
        )
        String color,

        @Size(
                max = 50,
                message = "O ícone deve ter no máximo 50 caracteres"
        )
        String icon
) {
}