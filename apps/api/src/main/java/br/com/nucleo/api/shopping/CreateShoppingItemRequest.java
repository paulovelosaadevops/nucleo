package br.com.nucleo.api.shopping;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateShoppingItemRequest(

        @NotBlank(message = "Informe o nome do item")
        @Size(
                max = 160,
                message = "O nome do item deve ter no máximo 160 caracteres"
        )
        String name,

        @Size(
                max = 500,
                message = "A descrição deve ter no máximo 500 caracteres"
        )
        String description,

        ShoppingItemCategory category,

        @DecimalMin(
                value = "0.001",
                message = "A quantidade deve ser maior que zero"
        )
        @Digits(
                integer = 9,
                fraction = 3,
                message = "A quantidade deve ter até 9 inteiros e 3 decimais"
        )
        BigDecimal quantity,

        ShoppingItemUnit unit,

        @DecimalMin(
                value = "0.00",
                message = "O preço estimado não pode ser negativo"
        )
        @Digits(
                integer = 12,
                fraction = 2,
                message = "O preço estimado deve ter até 12 inteiros e 2 decimais"
        )
        BigDecimal estimatedUnitPrice,

        ShoppingItemPriority priority,

        UUID assignedToMembershipId
) {
}