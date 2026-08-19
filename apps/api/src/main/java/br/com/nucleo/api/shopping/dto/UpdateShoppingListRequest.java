package br.com.nucleo.api.shopping.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateShoppingListRequest(

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