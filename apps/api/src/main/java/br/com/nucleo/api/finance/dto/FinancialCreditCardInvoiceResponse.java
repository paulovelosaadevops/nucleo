package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoice;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoiceStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record FinancialCreditCardInvoiceResponse(
        UUID id,
        UUID creditCardId,
        String creditCardName,
        LocalDate referenceMonth,
        LocalDate closingDate,
        LocalDate dueDate,
        FinancialCreditCardInvoiceStatus status,
        BigDecimal totalAmount,
        Instant paidAt,
        List<FinancialCreditCardInstallmentResponse> installments,
        Instant createdAt,
        Instant updatedAt
) {

    public static FinancialCreditCardInvoiceResponse from(
            FinancialCreditCardInvoice invoice,
            BigDecimal totalAmount,
            List<FinancialCreditCardInstallmentResponse> installments
    ) {
        return new FinancialCreditCardInvoiceResponse(
                invoice.getId(),
                invoice.getCreditCard().getId(),
                invoice.getCreditCard().getName(),
                invoice.getReferenceMonth(),
                invoice.getClosingDate(),
                invoice.getDueDate(),
                invoice.getStatus(),
                totalAmount == null
                        ? BigDecimal.ZERO
                        : totalAmount,
                invoice.getPaidAt(),
                installments,
                invoice.getCreatedAt(),
                invoice.getUpdatedAt()
        );
    }
}