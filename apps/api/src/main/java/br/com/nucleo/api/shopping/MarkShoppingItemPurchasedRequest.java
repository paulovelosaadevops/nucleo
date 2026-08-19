package br.com.nucleo.api.shopping;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;

public record MarkShoppingItemPurchasedRequest(

        @DecimalMin(
                value = "0.00",
                message = "O preço real não pode ser negativo"
        )
        @Digits(
                integer = 12,
                fraction = 2,
                message = "O preço real deve ter até 12 inteiros e 2 decimais"
        )
        BigDecimal actualUnitPrice
) {
}