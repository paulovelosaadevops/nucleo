package br.com.nucleo.api.finance.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;

class FinancialCreditCardInvoiceAmountsTest {

    @Test
    void debitIncreasesInvoice() {
        assertThat(FinancialCreditCardInvoiceAmounts.signedAmount(
                FinancialCreditCardPurchaseType.DEBIT,
                new BigDecimal("100.00")
        )).isEqualByComparingTo("100.00");
    }

    @Test
    void creditReducesInvoice() {
        assertThat(FinancialCreditCardInvoiceAmounts.signedAmount(
                FinancialCreditCardPurchaseType.CREDIT,
                new BigDecimal("26.32")
        )).isEqualByComparingTo("-26.32");
    }

    @Test
    void creditCannotIncreaseInvoiceWithNegativeAmount() {
        assertThatThrownBy(() ->
                FinancialCreditCardInvoiceAmounts.signedAmount(
                        FinancialCreditCardPurchaseType.CREDIT,
                        new BigDecimal("-26.32")
                )
        ).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void mixesDebitsAndCredits() {
        BigDecimal total = FinancialCreditCardInvoiceAmounts.netTotal(
                List.of(
                        new BigDecimal("100.00"),
                        new BigDecimal("50.00")
                ),
                List.of(new BigDecimal("25.00"))
        );

        assertThat(total).isEqualByComparingTo("125.00");
    }

    @Test
    void supportsIofCredits() {
        assertThat(FinancialCreditCardInvoiceAmounts.signedAmount(
                FinancialCreditCardPurchaseType.CREDIT,
                new BigDecimal("5.56")
        )).isEqualByComparingTo("-5.56");
    }

    @Test
    void supportsFullRefund() {
        BigDecimal total = FinancialCreditCardInvoiceAmounts.netTotal(
                List.of(new BigDecimal("51.90")),
                List.of(new BigDecimal("51.90"))
        );

        assertThat(total).isEqualByComparingTo("0.00");
    }

    @Test
    void supportsInstallmentsAsDebits() {
        BigDecimal total = FinancialCreditCardInvoiceAmounts.netTotal(
                List.of(
                        new BigDecimal("33.33"),
                        new BigDecimal("33.33"),
                        new BigDecimal("33.34")
                ),
                List.of()
        );

        assertThat(total).isEqualByComparingTo("100.00");
    }

    @Test
    void supportsRecurringCardPurchasesAsDebits() {
        assertThat(FinancialCreditCardInvoiceAmounts.signedAmount(
                FinancialCreditCardPurchaseType.DEBIT,
                new BigDecimal("19.90")
        )).isEqualByComparingTo("19.90");
    }

    @Test
    void reconcilesSeptember2026NubankScenario() {
        BigDecimal total = FinancialCreditCardInvoiceAmounts.netTotal(
                List.of(new BigDecimal("8556.94")),
                List.of(new BigDecimal("145.25"))
        );

        assertThat(total).isEqualByComparingTo("8411.69");
    }
}
