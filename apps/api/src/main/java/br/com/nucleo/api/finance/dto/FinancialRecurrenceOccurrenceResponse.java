package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialPaymentMethod;
import br.com.nucleo.api.finance.domain.FinancialRecurrenceOccurrence;
import br.com.nucleo.api.finance.domain.FinancialRecurrenceOccurrenceStatus;
import br.com.nucleo.api.finance.domain.FinancialTransactionType;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record FinancialRecurrenceOccurrenceResponse(
        UUID id,
        UUID recurrenceId,
        String description,
        FinancialTransactionType type,
        FinancialPaymentMethod paymentMethod,
        UUID accountId,
        String accountName,
        UUID creditCardId,
        String creditCardName,
        UUID categoryId,
        String categoryName,
        LocalDate referenceMonth,
        LocalDate scheduledDate,
        LocalDate reminderDate,
        FinancialRecurrenceOccurrenceStatus status,
        BigDecimal estimatedAmount,
        BigDecimal confirmedAmount,
        LocalDate confirmedDate,
        UUID transactionId,
        UUID purchaseId,
        String notes,
        UUID confirmedByUserId,
        String confirmedByName,
        Instant confirmedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static FinancialRecurrenceOccurrenceResponse from(
            FinancialRecurrenceOccurrence occurrence
    ) {
        return new FinancialRecurrenceOccurrenceResponse(
                occurrence.getId(),
                occurrence.getRecurrence().getId(),
                occurrence.getRecurrence().getDescription(),
                occurrence.getRecurrence().getType(),
                occurrence.getRecurrence().getPaymentMethod(),
                occurrence.getAccount() == null ? null : occurrence.getAccount().getId(),
                occurrence.getAccount() == null ? null : occurrence.getAccount().getName(),
                occurrence.getCreditCard() == null ? null : occurrence.getCreditCard().getId(),
                occurrence.getCreditCard() == null ? null : occurrence.getCreditCard().getName(),
                occurrence.getCategory() == null ? null : occurrence.getCategory().getId(),
                occurrence.getCategory() == null ? null : occurrence.getCategory().getName(),
                occurrence.getReferenceMonth(),
                occurrence.getScheduledDate(),
                occurrence.getReminderDate(),
                occurrence.getStatus(),
                occurrence.getEstimatedAmount(),
                occurrence.getConfirmedAmount(),
                occurrence.getConfirmedDate(),
                occurrence.getTransaction() == null ? null : occurrence.getTransaction().getId(),
                occurrence.getPurchase() == null ? null : occurrence.getPurchase().getId(),
                occurrence.getNotes(),
                occurrence.getConfirmedBy() == null ? null : occurrence.getConfirmedBy().getId(),
                occurrence.getConfirmedBy() == null ? null : occurrence.getConfirmedBy().getName(),
                occurrence.getConfirmedAt(),
                occurrence.getCreatedAt(),
                occurrence.getUpdatedAt()
        );
    }
}
