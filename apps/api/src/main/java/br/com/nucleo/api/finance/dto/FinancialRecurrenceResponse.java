package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialPaymentMethod;
import br.com.nucleo.api.finance.domain.FinancialRecurrence;
import br.com.nucleo.api.finance.domain.FinancialRecurrenceFrequency;
import br.com.nucleo.api.finance.domain.FinancialTransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record FinancialRecurrenceResponse(
        UUID id,
        UUID accountId,
        String accountName,
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
        UUID categoryId = null;
        String categoryName = null;

        if (recurrence.getCategory() != null) {
            categoryId = recurrence.getCategory().getId();
            categoryName = recurrence.getCategory().getName();
        }

        return new FinancialRecurrenceResponse(
                recurrence.getId(),
                recurrence.getAccount().getId(),
                recurrence.getAccount().getName(),
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