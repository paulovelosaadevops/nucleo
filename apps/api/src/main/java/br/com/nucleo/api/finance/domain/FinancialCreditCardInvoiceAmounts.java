package br.com.nucleo.api.finance.domain;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Objects;

public final class FinancialCreditCardInvoiceAmounts {

    private FinancialCreditCardInvoiceAmounts() {
    }

    public static BigDecimal signedAmount(
            FinancialCreditCardPurchaseType type,
            BigDecimal amount
    ) {
        BigDecimal positiveAmount = Objects.requireNonNull(amount);

        if (positiveAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Invoice item amount cannot be negative"
            );
        }

        if (type == FinancialCreditCardPurchaseType.CREDIT) {
            return positiveAmount.negate();
        }

        return positiveAmount;
    }

    public static BigDecimal netTotal(
            Collection<BigDecimal> debits,
            Collection<BigDecimal> credits
    ) {
        BigDecimal debitTotal = debits.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal creditTotal = credits.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return debitTotal.subtract(creditTotal);
    }
}
