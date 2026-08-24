package br.com.nucleo.api.finance.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import br.com.nucleo.api.finance.domain.FinancialPaymentMethod;
import br.com.nucleo.api.finance.domain.FinancialRecurrence;
import br.com.nucleo.api.finance.domain.FinancialRecurrenceFrequency;
import br.com.nucleo.api.finance.domain.FinancialTransactionType;

public record FinancialRecurrenceResponse(
        UUID id,
        UUID accountId,
        String accountName,
        UUID creditCardId,
        String creditCardName,
        UUID categoryId,
        String categoryName,
        FinancialTransactionType type,
        String description,
        BigDecimal amount,
        FinancialRecurrenceFrequency frequency,
        int interval,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate nextGenerationDate,
        Integer remainingOccurrences,
        FinancialPaymentMethod paymentMethod,
        String notes,
        boolean active,
        UUID createdByUserId,
        String createdByName,
        Instant createdAt,
        Instant updatedAt
) {

    public static FinancialRecurrenceResponse from(
            FinancialRecurrence recurrence
    ) {
        UUID accountId = null;
        String accountName = null;

        if (recurrence.getAccount() != null) {
            accountId = recurrence.getAccount().getId();
            accountName = recurrence.getAccount().getName();
        }

        UUID creditCardId = null;
        String creditCardName = null;

        if (recurrence.getCreditCard() != null) {
            creditCardId = recurrence.getCreditCard().getId();
            creditCardName = recurrence.getCreditCard().getName();
        }

        UUID categoryId = null;
        String categoryName = null;

        if (recurrence.getCategory() != null) {
            categoryId = recurrence.getCategory().getId();
            categoryName = recurrence.getCategory().getName();
        }

        return new FinancialRecurrenceResponse(
                recurrence.getId(),
                accountId,
                accountName,
                creditCardId,
                creditCardName,
                categoryId,
                categoryName,
                recurrence.getType(),
                recurrence.getDescription(),
                recurrence.getAmount(),
                recurrence.getFrequency(),
                recurrence.getInterval(),
                recurrence.getStartDate(),
                recurrence.getEndDate(),
                recurrence.getNextGenerationDate(),
                recurrence.getRemainingOccurrences(),
                recurrence.getPaymentMethod(),
                recurrence.getNotes(),
                recurrence.isActive(),
                recurrence.getCreatedBy().getId(),
                recurrence.getCreatedBy().getName(),
                recurrence.getCreatedAt(),
                recurrence.getUpdatedAt()
        );
    }
}