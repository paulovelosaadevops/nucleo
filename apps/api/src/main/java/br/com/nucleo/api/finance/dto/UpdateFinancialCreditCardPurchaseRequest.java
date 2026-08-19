package br.com.nucleo.api.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record UpdateFinancialCreditCardPurchaseRequest(

        UUID categoryId,

        @NotBlank(message = "Informe a descrição")
        @Size(max = 160)
        String description,

        @Size(max = 1000)
        String notes
) {
}