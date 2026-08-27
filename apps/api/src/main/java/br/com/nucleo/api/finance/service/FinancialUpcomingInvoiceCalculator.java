package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.finance.dto.FinancialDashboardResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class FinancialUpcomingInvoiceCalculator {
    private static final int MONTH_COUNT = 3;

    public List<FinancialDashboardResponse.UpcomingInvoiceTotal> nextThreeInvoices(
            LocalDate referenceMonth,
            List<FinancialDashboardResponse.InvoiceProjection> invoices
    ) {
        YearMonth firstMonth = YearMonth.from(referenceMonth);
        YearMonth lastMonth = firstMonth.plusMonths(MONTH_COUNT - 1);
        Map<YearMonth, Accumulator> grouped = new LinkedHashMap<>();

        invoices.stream()
                .filter(invoice -> invoice.status()
                        != br.com.nucleo.api.finance.domain.FinancialCreditCardInvoiceStatus.CANCELLED)
                .filter(invoice -> {
                    YearMonth dueMonth = YearMonth.from(invoice.dueDate());
                    return !dueMonth.isBefore(firstMonth)
                            && !dueMonth.isAfter(lastMonth);
                })
                .forEach(invoice -> grouped
                        .computeIfAbsent(
                                YearMonth.from(invoice.dueDate()),
                                ignored -> new Accumulator()
                        )
                        .add(invoice.totalAmount()));

        return grouped.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new FinancialDashboardResponse.UpcomingInvoiceTotal(
                        entry.getKey().atDay(1),
                        entry.getValue().total,
                        entry.getValue().count
                ))
                .sorted(Comparator.comparing(
                        FinancialDashboardResponse.UpcomingInvoiceTotal::referenceMonth
                ))
                .toList();
    }

    private static final class Accumulator {
        private BigDecimal total = BigDecimal.ZERO;
        private long count;

        private void add(BigDecimal amount) {
            total = total.add(amount);
            count++;
        }
    }
}
