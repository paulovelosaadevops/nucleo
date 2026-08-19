package br.com.nucleo.api.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record FinancialDashboardResponse(
        LocalDate from,
        LocalDate to,
        BigDecimal totalAccountBalance,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal periodBalance,
        BigDecimal pendingIncome,
        BigDecimal pendingExpense,
        BigDecimal overdueExpense,
        long overdueTransactionCount,
        List<FinancialCategorySummaryResponse> incomeByCategory,
        List<FinancialCategorySummaryResponse> expenseByCategory
) {
}