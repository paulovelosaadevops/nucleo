package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialPaymentMethod;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record PayFinancialCreditCardInvoiceRequest(

        UUID accountId,

        @NotNull(message = "Informe a data do pagamento")
        LocalDate paymentDate,

        @NotNull(message = "Informe a forma de pagamento")
        FinancialPaymentMethod paymentMethod
) {
}