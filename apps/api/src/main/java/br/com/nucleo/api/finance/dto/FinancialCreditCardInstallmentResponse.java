package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialCreditCardInstallment;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInstallmentStatus;
import br.com.nucleo.api.finance.domain.FinancialCreditCardPurchaseType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record FinancialCreditCardInstallmentResponse(
        UUID id,
        UUID purchaseId,
        String purchaseDescription,
        LocalDate purchaseDate,
        FinancialCreditCardPurchaseType purchaseType,
        UUID categoryId,
        String categoryName,
        int installmentNumber,
        int totalInstallments,
        BigDecimal amount,
        FinancialCreditCardInstallmentStatus status,
        boolean paid,
        UUID invoiceId,
        LocalDate invoiceReferenceMonth,
        LocalDate invoiceDueDate
) {

    public static FinancialCreditCardInstallmentResponse from(
            FinancialCreditCardInstallment installment
    ) {
        UUID categoryId = null;
        String categoryName = null;

        if (installment.getPurchase().getCategory() != null) {
            categoryId = installment
                    .getPurchase()
                    .getCategory()
                    .getId();

            categoryName = installment
                    .getPurchase()
                    .getCategory()
                    .getName();
        }

        return new FinancialCreditCardInstallmentResponse(
                installment.getId(),
                installment.getPurchase().getId(),
                installment.getPurchase().getDescription(),
                installment.getPurchase().getPurchaseDate(),
                installment.getPurchase().getPurchaseType(),
                categoryId,
                categoryName,
                installment.getInstallmentNumber(),
                installment.getPurchase().getTotalInstallments(),
                installment.getAmount(),
                installment.getStatus(),
                installment.isPaid(),
                installment.getInvoice().getId(),
                installment.getInvoice().getReferenceMonth(),
                installment.getInvoice().getDueDate()
        );
    }
}
