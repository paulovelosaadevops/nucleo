package br.com.nucleo.api.shopping;

import java.time.LocalDate;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;

public record CreateShoppingListRequest(

        @NotBlank(message = "Informe o nome da lista")
        @Size(
                min = 2,
                max = 120,
                message = "O nome da lista deve ter entre 2 e 120 caracteres"
        )
        String name,

        @Size(
                max = 500,
                message = "A descrição deve ter no máximo 500 caracteres"
        )
        String description,

        LocalDate dueDate
) {
}