package br.com.nucleo.api.finance.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import br.com.nucleo.api.finance.domain.FinancialCreditCardPurchase;
import br.com.nucleo.api.finance.domain.FinancialCreditCardPurchaseStatus;

public record FinancialCreditCardPurchaseResponse(
        UUID id,
        UUID creditCardId,
        String creditCardName,
        UUID categoryId,
        String categoryName,
        UUID recurrenceId,
        Integer recurrenceSequence,
        String description,
        BigDecimal totalAmount,
        LocalDate purchaseDate,
        int totalInstallments,
        FinancialCreditCardPurchaseStatus status,
        String notes,
        String createdByName,
        List<FinancialCreditCardInstallmentResponse> installments,
        Instant createdAt,
        Instant updatedAt
) {

    public static FinancialCreditCardPurchaseResponse from(
            FinancialCreditCardPurchase purchase,
            List<FinancialCreditCardInstallmentResponse> installments
    ) {
        UUID categoryId = null;
        String categoryName = null;

        if (purchase.getCategory() != null) {
            categoryId = purchase.getCategory().getId();
            categoryName = purchase.getCategory().getName();
        }

        UUID recurrenceId = null;

        if (purchase.getRecurrence() != null) {
            recurrenceId = purchase.getRecurrence().getId();
        }

        return new FinancialCreditCardPurchaseResponse(
                purchase.getId(),
                purchase.getCreditCard().getId(),
                purchase.getCreditCard().getName(),
                categoryId,
                categoryName,
                recurrenceId,
                purchase.getRecurrenceSequence(),
                purchase.getDescription(),
                purchase.getTotalAmount(),
                purchase.getPurchaseDate(),
                purchase.getTotalInstallments(),
                purchase.getStatus(),
                purchase.getNotes(),
                purchase.getCreatedBy().getName(),
                installments,
                purchase.getCreatedAt(),
                purchase.getUpdatedAt()
        );
    }
}