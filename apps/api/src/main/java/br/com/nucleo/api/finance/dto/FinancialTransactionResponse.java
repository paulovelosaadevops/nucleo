package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialPaymentMethod;
import br.com.nucleo.api.finance.domain.FinancialTransaction;
import br.com.nucleo.api.finance.domain.FinancialTransactionStatus;
import br.com.nucleo.api.finance.domain.FinancialTransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record FinancialTransactionResponse(
        UUID id,
        UUID accountId,
        String accountName,
        UUID categoryId,
        String categoryName,
        String categoryColor,
        String categoryIcon,
        FinancialTransactionType type,
        String description,
        BigDecimal amount,
        LocalDate transactionDate,
        LocalDate dueDate,
        FinancialTransactionStatus status,
        FinancialPaymentMethod paymentMethod,
        Instant paidAt,
        boolean overdue,
        String notes,
        UUID createdByUserId,
        String createdByName,
        Instant createdAt,
        Instant updatedAt
) {

    public static FinancialTransactionResponse from(
            FinancialTransaction transaction,
            LocalDate today
    ) {
        UUID categoryId = null;
        String categoryName = null;
        String categoryColor = null;
        String categoryIcon = null;

        if (transaction.getCategory() != null) {
            categoryId = transaction.getCategory().getId();
            categoryName = transaction.getCategory().getName();
            categoryColor = transaction.getCategory().getColor();
            categoryIcon = transaction.getCategory().getIcon();
        }

        boolean overdue =
                transaction.isPending()
                        && transaction.getDueDate() != null
                        && transaction.getDueDate().isBefore(today);

        return new FinancialTransactionResponse(
                transaction.getId(),
                transaction.getAccount().getId(),
                transaction.getAccount().getName(),
                categoryId,
                categoryName,
                categoryColor,
                categoryIcon,
                transaction.getType(),
                transaction.getDescription(),
                transaction.getAmount(),
                transaction.getTransactionDate(),
                transaction.getDueDate(),
                transaction.getStatus(),
                transaction.getPaymentMethod(),
                transaction.getPaidAt(),
                overdue,
                transaction.getNotes(),
                transaction.getCreatedBy().getId(),
                transaction.getCreatedBy().getName(),
                transaction.getCreatedAt(),
                transaction.getUpdatedAt()
        );
    }
}