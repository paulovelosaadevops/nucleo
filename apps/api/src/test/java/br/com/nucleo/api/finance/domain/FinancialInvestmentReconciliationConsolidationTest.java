package br.com.nucleo.api.finance.domain;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.nucleo.api.family.domain.Family;
import br.com.nucleo.api.identity.user.domain.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class FinancialInvestmentReconciliationConsolidationTest {

    @Test
    void consolidatesSecondReconciliationForTurboNucelExample() {
        FinancialInvestment investment = investment("9436.04");
        BigDecimal first = investment.reconcile(new BigDecimal("9441.89"), LocalDate.of(2026, 8, 28));
        FinancialInvestmentMovement movement = movement(investment, first, "9436.04", "9441.89");

        BigDecimal beforeSecond = investment.getCalculatedBalance();
        BigDecimal real = new BigDecimal("9447.76");
        BigDecimal additional = investment.reconcile(real, LocalDate.of(2026, 8, 28));
        movement.consolidate(additional, real, "Segundo ajuste");

        assertThat(beforeSecond).isEqualByComparingTo("9441.89");
        assertThat(additional).isEqualByComparingTo("5.87");
        assertThat(movement.getAmount()).isEqualByComparingTo("11.72");
        assertThat(investment.getCalculatedBalance()).isEqualByComparingTo("9447.76");
    }

    @Test
    void consolidatesSecondReconciliationForUltravioletaExample() {
        FinancialInvestment investment = investment("10454.79");
        BigDecimal first = investment.reconcile(new BigDecimal("10461.28"), LocalDate.of(2026, 8, 28));
        FinancialInvestmentMovement movement = movement(investment, first, "10454.79", "10461.28");

        BigDecimal additional = investment.reconcile(new BigDecimal("10467.76"), LocalDate.of(2026, 8, 28));
        movement.consolidate(additional, new BigDecimal("10467.76"), null);

        assertThat(first).isEqualByComparingTo("6.49");
        assertThat(additional).isEqualByComparingTo("6.48");
        assertThat(movement.getAmount()).isEqualByComparingTo("12.97");
        assertThat(investment.getCalculatedBalance()).isEqualByComparingTo("10467.76");
    }

    @Test
    void acceptsNegativeAndZeroReconciliationAdjustments() {
        FinancialInvestment negative = investment("10000.00");
        assertThat(negative.reconcile(new BigDecimal("9995.00"), LocalDate.of(2026, 8, 28)))
                .isEqualByComparingTo("-5.00");

        FinancialInvestment zero = investment("10000.00");
        assertThat(zero.reconcile(new BigDecimal("10000.00"), LocalDate.of(2026, 8, 28)))
                .isEqualByComparingTo("0.00");
    }

    private FinancialInvestment investment(String amount) {
        User user = User.create("Paulo Velosa", "paulo@example.com", "hash");
        Family family = Family.create("Nucleo", user);
        return FinancialInvestment.create(
                family,
                "Caixinha",
                "Nubank",
                FinancialInvestmentModality.MANUAL,
                LocalDate.of(2026, 8, 28),
                null,
                null,
                null,
                null,
                null,
                false,
                false,
                FinancialInvestmentAccrualStartRule.NEXT_BUSINESS_DAY,
                new BigDecimal(amount),
                null,
                user
        );
    }

    private FinancialInvestmentMovement movement(
            FinancialInvestment investment,
            BigDecimal amount,
            String before,
            String after
    ) {
        return FinancialInvestmentMovement.create(
                investment,
                null,
                FinancialInvestmentMovementType.RECONCILIATION,
                LocalDate.of(2026, 8, 28),
                amount,
                new BigDecimal(before),
                new BigDecimal(after),
                null,
                "test"
        );
    }
}
