package br.com.nucleo.api.finance.service;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoiceStatus;
import br.com.nucleo.api.finance.dto.FinancialDashboardResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class FinancialUpcomingInvoiceCalculatorTest {
    private final FinancialUpcomingInvoiceCalculator calculator =
            new FinancialUpcomingInvoiceCalculator();

    @Test
    void doesNotAddRecurrenceAlreadyPresentInInvoice() {
        List<FinancialDashboardResponse.UpcomingInvoiceTotal> result =
                calculator.nextThreeInvoices(
                        LocalDate.of(2026, 9, 1),
                        List.of(invoice("2026-09-01", "2026-09-10", "8411.69"))
                );

        assertThat(result).hasSize(1);
        assertThat(result.get(0).totalAmount()).isEqualByComparingTo("8411.69");
    }

    @Test
    void doesNotAddInstallmentsOutsideConsolidatedInvoice() {
        List<FinancialDashboardResponse.UpcomingInvoiceTotal> result =
                calculator.nextThreeInvoices(
                        LocalDate.of(2026, 9, 1),
                        List.of(invoice("2026-09-01", "2026-09-10", "300.00"))
                );

        assertThat(result.get(0).totalAmount()).isEqualByComparingTo("300.00");
    }

    @Test
    void returnsNextThreeInvoiceDueMonths() {
        List<FinancialDashboardResponse.UpcomingInvoiceTotal> result =
                calculator.nextThreeInvoices(
                        LocalDate.of(2026, 9, 1),
                        List.of(
                                invoice("2026-09-01", "2026-09-10", "100.00"),
                                invoice("2026-10-01", "2026-10-10", "200.00"),
                                invoice("2026-11-01", "2026-11-10", "300.00"),
                                invoice("2026-12-01", "2026-12-10", "400.00")
                        )
                );

        assertThat(result).extracting(FinancialDashboardResponse.UpcomingInvoiceTotal::totalAmount)
                .containsExactly(
                        new BigDecimal("100.00"),
                        new BigDecimal("200.00"),
                        new BigDecimal("300.00")
                );
    }

    @Test
    void consolidatesMultipleInvoicesInSameDueMonthOnceEach() {
        List<FinancialDashboardResponse.UpcomingInvoiceTotal> result =
                calculator.nextThreeInvoices(
                        LocalDate.of(2026, 9, 1),
                        List.of(
                                invoice("2026-09-01", "2026-09-10", "8411.69"),
                                invoice("2026-09-01", "2026-09-15", "120.31")
                        )
                );

        assertThat(result).hasSize(1);
        assertThat(result.get(0).totalAmount()).isEqualByComparingTo("8532.00");
        assertThat(result.get(0).invoiceCount()).isEqualTo(2);
    }

    private FinancialDashboardResponse.InvoiceProjection invoice(
            String referenceMonth,
            String dueDate,
            String amount
    ) {
        return new FinancialDashboardResponse.InvoiceProjection(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Cartao",
                "1234",
                LocalDate.parse(referenceMonth),
                LocalDate.parse(referenceMonth).plusDays(24),
                LocalDate.parse(dueDate),
                FinancialCreditCardInvoiceStatus.OPEN,
                new BigDecimal(amount),
                1
        );
    }
}
