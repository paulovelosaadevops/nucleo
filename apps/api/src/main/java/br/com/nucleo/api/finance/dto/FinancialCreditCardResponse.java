package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialCreditCard;
import br.com.nucleo.api.finance.domain.FinancialCreditCardBrand;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FinancialCreditCardResponse(
        UUID id,
        String name,
        FinancialCreditCardBrand brand,
        String lastFour,
        BigDecimal creditLimit,
        BigDecimal outstandingAmount,
        BigDecimal availableLimit,
        int closingDay,
        int dueDay,
        UUID paymentAccountId,
        String paymentAccountName,
        String color,
        boolean active,
        String createdByName,
        Instant createdAt,
        Instant updatedAt
) {

    public static FinancialCreditCardResponse from(
            FinancialCreditCard card,
            BigDecimal outstandingAmount
    ) {
        BigDecimal outstanding = outstandingAmount == null
                ? BigDecimal.ZERO
                : outstandingAmount;

        UUID paymentAccountId = null;
        String paymentAccountName = null;

        if (card.getPaymentAccount() != null) {
            paymentAccountId = card.getPaymentAccount().getId();
            paymentAccountName = card.getPaymentAccount().getName();
        }

        return new FinancialCreditCardResponse(
                card.getId(),
                card.getName(),
                card.getBrand(),
                card.getLastFour(),
                card.getCreditLimit(),
                outstanding,
                card.getCreditLimit().subtract(outstanding),
                card.getClosingDay(),
                card.getDueDay(),
                paymentAccountId,
                paymentAccountName,
                card.getColor(),
                card.isActive(),
                card.getCreatedBy().getName(),
                card.getCreatedAt(),
                card.getUpdatedAt()
        );
    }
}