package br.com.nucleo.api.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import br.com.nucleo.api.finance.domain.FinancialBudgetStatus;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoiceStatus;
import br.com.nucleo.api.finance.domain.FinancialRecurrenceFrequency;
import br.com.nucleo.api.finance.domain.FinancialTransactionType;

public record FinancialDashboardResponse(
        LocalDate from,
        LocalDate to,
        BigDecimal totalAccountBalance,
        BigDecimal availableAccountBalance,
        BigDecimal investmentBalance,
        BigDecimal projectedBalance,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal periodBalance,
        BigDecimal pendingIncome,
        BigDecimal pendingExpense,
        BigDecimal overdueExpense,
        long overdueTransactionCount,
        BigDecimal currentInvoiceAmount,
        BigDecimal remainingInstallmentAmount,
        long activeInstallmentPurchaseCount,
        BigDecimal recurringExpenseNext30Days,
        long activeRecurrenceCount,
        FinancialInvestmentDashboardResponse investmentSummary,
        List<FinancialCategorySummaryResponse> incomeByCategory,
        List<FinancialCategorySummaryResponse> expenseByCategory,
        List<InvoiceProjection> invoices,
        List<MonthlyProjection> nextThreeMonths,
        List<RecurrenceItem> recurrences,
        List<InstallmentCommitment> installmentCommitments,
        List<BudgetProgress> budgets,
        List<UpcomingItem> upcomingItems
) {

    public record InvoiceProjection(
            UUID invoiceId,
            UUID creditCardId,
            String creditCardName,
            String lastFour,
            LocalDate referenceMonth,
            LocalDate closingDate,
            LocalDate dueDate,
            FinancialCreditCardInvoiceStatus status,
            BigDecimal totalAmount,
            int installmentCount
    ) {
    }

    public record MonthlyProjection(
            LocalDate referenceMonth,
            BigDecimal expectedIncome,
            BigDecimal accountExpenses,
            BigDecimal creditCardExpenses,
            BigDecimal recurrenceForecast,
            BigDecimal totalCommitted,
            BigDecimal projectedResult
    ) {
    }

    public record RecurrenceItem(
            UUID id,
            String description,
            BigDecimal amount,
            FinancialTransactionType type,
            FinancialRecurrenceFrequency frequency,
            int interval,
            LocalDate nextGenerationDate,
            String sourceName,
            boolean creditCard
    ) {
    }

    public record InstallmentCommitment(
            UUID purchaseId,
            String description,
            String creditCardName,
            int currentInstallment,
            int totalInstallments,
            int remainingInstallments,
            BigDecimal installmentAmount,
            BigDecimal remainingAmount,
            LocalDate nextDueDate
    ) {
    }

    public record BudgetProgress(
            UUID budgetId,
            UUID categoryId,
            String categoryName,
            BigDecimal limitAmount,
            BigDecimal committedAmount,
            BigDecimal remainingAmount,
            BigDecimal consumptionPercentage,
            FinancialBudgetStatus status
    ) {
    }

    public record UpcomingItem(
            String kind,
            UUID id,
            String description,
            String sourceName,
            LocalDate dueDate,
            BigDecimal amount,
            boolean overdue
    ) {
    }
}
