package br.com.nucleo.api.settings.dto;

import br.com.nucleo.api.settings.domain.WeekStartDay;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateFamilySettingsRequest(

        @NotBlank(message = "Informe o nome do núcleo familiar")
        @Size(
                min = 2,
                max = 120,
                message = "O nome deve ter entre 2 e 120 caracteres"
        )
        String familyName,

        @NotBlank(message = "Informe o fuso horário")
        @Size(
                max = 50,
                message = "O fuso horário deve ter no máximo 50 caracteres"
        )
        String timeZone,

        @NotBlank(message = "Informe a moeda padrão")
        @Pattern(
                regexp = "^[a-zA-Z]{3}$",
                message = "A moeda deve possuir três letras"
        )
        String defaultCurrency,

        @NotBlank(message = "Informe o idioma")
        @Size(
                min = 2,
                max = 20,
                message = "O idioma deve ter entre 2 e 20 caracteres"
        )
        @Pattern(
                regexp = "^[a-zA-Z]{2,8}([_-][a-zA-Z0-9]{1,8})*$",
                message = "Informe um idioma válido, como pt-BR"
        )
        String locale,

        @NotNull(message = "Informe o primeiro dia da semana")
        WeekStartDay weekStartDay
) {
}