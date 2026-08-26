package br.com.nucleo.api.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import br.com.nucleo.api.finance.domain.FinancialCreditCardPurchaseType;

public record CreateFinancialCreditCardPurchaseRequest(

        @NotNull(message = "Informe o cartão")
        UUID creditCardId,

        UUID categoryId,

        @NotBlank(message = "Informe a descrição")
        @Size(max = 160)
        String description,

        @NotNull(message = "Informe o valor total")
        @DecimalMin(value = "0.01")
        @Digits(integer = 16, fraction = 2)
        BigDecimal totalAmount,

        FinancialCreditCardPurchaseType purchaseType,

        @NotNull(message = "Informe a data da compra")
        LocalDate purchaseDate,

        @Min(value = 1, message = "A compra deve ter ao menos uma parcela")
        @Max(value = 120, message = "O máximo é de 120 parcelas")
        int totalInstallments,

        @Size(max = 1000)
        String notes
) {
}
