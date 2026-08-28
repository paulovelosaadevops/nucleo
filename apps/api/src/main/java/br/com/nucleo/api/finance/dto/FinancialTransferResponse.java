package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialTransfer;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record FinancialTransferResponse(
        UUID id,
        UUID sourceAccountId,
        String sourceAccountName,
        UUID destinationAccountId,
        String destinationAccountName,
        BigDecimal amount,
        LocalDate occurredAt,
        String description,
        UUID sourceTransactionId,
        UUID destinationTransactionId,
        Instant createdAt,
        Instant updatedAt
) {
    public static FinancialTransferResponse from(
            FinancialTransfer transfer,
            UUID sourceTransactionId,
            UUID destinationTransactionId
    ) {
        return new FinancialTransferResponse(
                transfer.getId(),
                transfer.getSourceAccount().getId(),
                transfer.getSourceAccount().getName(),
                transfer.getDestinationAccount().getId(),
                transfer.getDestinationAccount().getName(),
                transfer.getAmount(),
                transfer.getTransferDate(),
                transfer.getNotes(),
                sourceTransactionId,
                destinationTransactionId,
                transfer.getCreatedAt(),
                transfer.getUpdatedAt()
        );
    }
}
