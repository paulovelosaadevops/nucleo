package br.com.nucleo.api.finance.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialAccount;
import br.com.nucleo.api.finance.domain.FinancialBudget;
import br.com.nucleo.api.finance.domain.FinancialBudgetStatus;
import br.com.nucleo.api.finance.domain.FinancialCategory;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInstallment;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoice;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoiceStatus;
import br.com.nucleo.api.finance.domain.FinancialRecurrence;
import br.com.nucleo.api.finance.domain.FinancialTransaction;
import br.com.nucleo.api.finance.domain.FinancialTransactionStatus;
import br.com.nucleo.api.finance.domain.FinancialTransactionType;
import br.com.nucleo.api.finance.dto.FinancialCategorySummaryResponse;
import br.com.nucleo.api.finance.dto.FinancialDashboardResponse;
import br.com.nucleo.api.finance.repository.FinancialAccountRepository;
import br.com.nucleo.api.finance.repository.FinancialBudgetRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInstallmentRepository;
import br.com.nucleo.api.finance.repository.FinancialRecurrenceRepository;
import br.com.nucleo.api.finance.repository.FinancialTransactionRepository;

@Service
public class FinancialDashboardService {

    private static final long MAXIMUM_PERIOD_IN_DAYS = 366;
    private static final int UPCOMING_MONTHS = 3;

    private final FamilyAccessService familyAccessService;
    private final FinancialAccountRepository accountRepository;
    private final FinancialTransactionRepository transactionRepository;
    private final FinancialCreditCardInstallmentRepository installmentRepository;
    private final FinancialRecurrenceRepository recurrenceRepository;
    private final FinancialBudgetRepository budgetRepository;

    public FinancialDashboardService(
            FamilyAccessService familyAccessService,
            FinancialAccountRepository accountRepository,
            FinancialTransactionRepository transactionRepository,
            FinancialCreditCardInstallmentRepository installmentRepository,
            FinancialRecurrenceRepository recurrenceRepository,
            FinancialBudgetRepository budgetRepository
    ) {
        this.familyAccessService = familyAccessService;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.installmentRepository = installmentRepository;
        this.recurrenceRepository = recurrenceRepository;
        this.budgetRepository = budgetRepository;
    }

    @Transactional(readOnly = true)
    public FinancialDashboardResponse getDashboard(
            UUID currentUserId,
            LocalDate from,
            LocalDate to
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(currentUserId);

        validatePeriod(from, to);

        UUID familyId = membership.getFamily().getId();
        LocalDate referenceMonth = from.withDayOfMonth(1);
        LocalDate projectionEnd = referenceMonth
                .plusMonths(UPCOMING_MONTHS)
                .withDayOfMonth(1)
                .minusDays(1);

        List<FinancialTransaction> transactions = regularTransactions(
                familyId,
                from,
                to
        );
        List<FinancialTransaction> horizonTransactions = regularTransactions(
                familyId,
                referenceMonth,
                projectionEnd
        );
        List<FinancialCreditCardInstallment> installments =
                installmentRepository.findAllForDashboardPeriod(
                        familyId,
                        from,
                        to
                );
        List<FinancialCreditCardInstallment> openCommitments =
                installmentRepository.findAllOpenCommitments(
                        familyId,
                        referenceMonth
                );
        List<FinancialRecurrence> activeRecurrences = recurrenceRepository
                .findAllByFamily_IdOrderByActiveDescCreatedAtDesc(familyId)
                .stream()
                .filter(FinancialRecurrence::isActive)
                .toList();

        LocalDate invoiceAnchor = YearMonth.from(referenceMonth)
                .equals(YearMonth.from(LocalDate.now()))
                ? openCommitments.stream()
                        .map(item -> item.getInvoice().getReferenceMonth())
                        .min(LocalDate::compareTo)
                        .orElse(referenceMonth)
                : referenceMonth;

        BigDecimal totalIncome = sumTransactions(
                transactions,
                FinancialTransactionType.INCOME,
                FinancialTransactionStatus.PAID
        );
        BigDecimal totalExpense = sumTransactions(
                transactions,
                FinancialTransactionType.EXPENSE,
                FinancialTransactionStatus.PAID
        ).add(sumPaidInstallments(installments));
        BigDecimal pendingIncome = sumTransactions(
                transactions,
                FinancialTransactionType.INCOME,
                FinancialTransactionStatus.PENDING
        );
        BigDecimal pendingExpense = sumTransactions(
                transactions,
                FinancialTransactionType.EXPENSE,
                FinancialTransactionStatus.PENDING
        ).add(sumPendingInstallments(installments));

        LocalDate today = LocalDate.now();
        List<FinancialTransaction> overdueTransactions = transactions.stream()
                .filter(transaction -> transaction.getType()
                        == FinancialTransactionType.EXPENSE)
                .filter(FinancialTransaction::isPending)
                .filter(transaction -> transaction.getDueDate() != null)
                .filter(transaction -> transaction.getDueDate().isBefore(today))
                .toList();
        List<FinancialCreditCardInstallment> overdueInstallments =
                installments.stream()
                        .filter(this::isPendingInstallment)
                        .filter(installment -> installment.getInvoice()
                                .getDueDate().isBefore(today))
                        .toList();

        BigDecimal overdueExpense = sumTransactionAmounts(overdueTransactions)
                .add(sumInstallmentAmounts(overdueInstallments));
        long overdueCount = overdueTransactions.size()
                + overdueInstallments.size();
        BigDecimal totalAccountBalance = calculateTotalAccountBalance(familyId);
        BigDecimal currentInvoiceAmount = openCommitments.stream()
                .filter(item -> item.getInvoice().getReferenceMonth()
                        .equals(invoiceAnchor))
                .map(FinancialCreditCardInstallment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal remainingInstallmentAmount = openCommitments.stream()
                .filter(item -> item.getPurchase().getTotalInstallments() > 1)
                .map(FinancialCreditCardInstallment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long activeInstallmentPurchaseCount = openCommitments.stream()
                .filter(item -> item.getPurchase().getTotalInstallments() > 1)
                .map(item -> item.getPurchase().getId())
                .distinct()
                .count();
        BigDecimal recurringExpenseNext30Days = forecastRecurrences(
                activeRecurrences,
                today,
                today.plusDays(30),
                FinancialTransactionType.EXPENSE
        );

        return new FinancialDashboardResponse(
                from,
                to,
                totalAccountBalance,
                totalAccountBalance.add(pendingIncome).subtract(pendingExpense),
                totalIncome,
                totalExpense,
                totalIncome.subtract(totalExpense),
                pendingIncome,
                pendingExpense,
                overdueExpense,
                overdueCount,
                currentInvoiceAmount,
                remainingInstallmentAmount,
                activeInstallmentPurchaseCount,
                recurringExpenseNext30Days,
                activeRecurrences.size(),
                summarizeIncomeByCategory(transactions, totalIncome),
                summarizeExpenseByCategory(
                        transactions,
                        installments,
                        totalExpense
                ),
                buildInvoices(invoiceAnchor, installments, openCommitments),
                buildMonthlyProjections(
                        referenceMonth,
                        horizonTransactions,
                        openCommitments,
                        activeRecurrences
                ),
                buildRecurrences(activeRecurrences),
                buildInstallmentCommitments(openCommitments),
                buildBudgets(familyId, referenceMonth, transactions, installments),
                buildUpcomingItems(horizonTransactions, openCommitments, today)
        );
    }

    private List<FinancialTransaction> regularTransactions(
            UUID familyId,
            LocalDate from,
            LocalDate to
    ) {
        return transactionRepository.search(
                familyId, from, to, null, null, null, null
        ).stream().filter(item -> !item.isExcludedFromReports()).toList();
    }

    private List<FinancialDashboardResponse.InvoiceProjection> buildInvoices(
            LocalDate referenceMonth,
            List<FinancialCreditCardInstallment> periodInstallments,
            List<FinancialCreditCardInstallment> openCommitments
    ) {
        LocalDate lastMonth = referenceMonth.plusMonths(3);
        Map<UUID, List<FinancialCreditCardInstallment>> grouped =
                new LinkedHashMap<>();

        Map<UUID, FinancialCreditCardInstallment> unique = new LinkedHashMap<>();
        periodInstallments.forEach(item -> unique.put(item.getId(), item));
        openCommitments.forEach(item -> unique.put(item.getId(), item));
        unique.values().stream()
                .filter(item -> !item.getInvoice().getReferenceMonth()
                        .isBefore(referenceMonth))
                .filter(item -> !item.getInvoice().getReferenceMonth()
                        .isAfter(lastMonth))
                .forEach(item -> grouped
                        .computeIfAbsent(item.getInvoice().getId(), ignored ->
                                new ArrayList<>())
                        .add(item));

        return grouped.values().stream()
                .map(items -> {
                    FinancialCreditCardInvoice invoice = items.get(0).getInvoice();
                    return new FinancialDashboardResponse.InvoiceProjection(
                            invoice.getId(),
                            invoice.getCreditCard().getId(),
                            invoice.getCreditCard().getName(),
                            invoice.getCreditCard().getLastFour(),
                            invoice.getReferenceMonth(),
                            invoice.getClosingDate(),
                            invoice.getDueDate(),
                            invoice.getStatus(),
                            items.stream()
                                    .map(FinancialCreditCardInstallment::getAmount)
                                    .reduce(BigDecimal.ZERO, BigDecimal::add),
                            items.size()
                    );
                })
                .sorted(Comparator
                        .comparing(FinancialDashboardResponse.InvoiceProjection::referenceMonth)
                        .thenComparing(FinancialDashboardResponse.InvoiceProjection::creditCardName))
                .toList();
    }

    private List<FinancialDashboardResponse.MonthlyProjection>
            buildMonthlyProjections(
                    LocalDate referenceMonth,
                    List<FinancialTransaction> transactions,
                    List<FinancialCreditCardInstallment> installments,
                    List<FinancialRecurrence> recurrences
            ) {
        List<FinancialDashboardResponse.MonthlyProjection> result =
                new ArrayList<>();

        for (int offset = 0; offset < UPCOMING_MONTHS; offset++) {
            LocalDate monthStart = referenceMonth.plusMonths(offset);
            LocalDate monthEnd = monthStart.withDayOfMonth(
                    monthStart.lengthOfMonth()
            );
            BigDecimal income = pendingTransactionsInPeriod(
                    transactions,
                    FinancialTransactionType.INCOME,
                    monthStart,
                    monthEnd
            );
            BigDecimal accountExpenses = pendingTransactionsInPeriod(
                    transactions,
                    FinancialTransactionType.EXPENSE,
                    monthStart,
                    monthEnd
            );
            BigDecimal creditCardExpenses = installments.stream()
                    .filter(item -> !item.getInvoice().getDueDate()
                            .isBefore(monthStart))
                    .filter(item -> !item.getInvoice().getDueDate()
                            .isAfter(monthEnd))
                    .map(FinancialCreditCardInstallment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal recurrenceExpenses = forecastRecurrences(
                    recurrences,
                    monthStart,
                    monthEnd,
                    FinancialTransactionType.EXPENSE
            );
            BigDecimal recurrenceIncome = forecastRecurrences(
                    recurrences,
                    monthStart,
                    monthEnd,
                    FinancialTransactionType.INCOME
            );
            BigDecimal expectedIncome = income.add(recurrenceIncome);
            BigDecimal committed = accountExpenses
                    .add(creditCardExpenses)
                    .add(recurrenceExpenses);

            result.add(new FinancialDashboardResponse.MonthlyProjection(
                    monthStart,
                    expectedIncome,
                    accountExpenses,
                    creditCardExpenses,
                    recurrenceExpenses,
                    committed,
                    expectedIncome.subtract(committed)
            ));
        }

        return result;
    }

    private BigDecimal pendingTransactionsInPeriod(
            List<FinancialTransaction> transactions,
            FinancialTransactionType type,
            LocalDate from,
            LocalDate to
    ) {
        return transactions.stream()
                .filter(FinancialTransaction::isPending)
                .filter(item -> item.getType() == type)
                .filter(item -> !effectiveDate(item).isBefore(from))
                .filter(item -> !effectiveDate(item).isAfter(to))
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<FinancialDashboardResponse.RecurrenceItem> buildRecurrences(
            List<FinancialRecurrence> recurrences
    ) {
        return recurrences.stream()
                .sorted(Comparator.comparing(FinancialRecurrence::getNextGenerationDate))
                .limit(8)
                .map(item -> new FinancialDashboardResponse.RecurrenceItem(
                        item.getId(),
                        item.getDescription(),
                        item.getAmount(),
                        item.getType(),
                        item.getFrequency(),
                        item.getInterval(),
                        item.getNextGenerationDate(),
                        item.getCreditCard() != null
                                ? item.getCreditCard().getName()
                                : item.getAccount().getName(),
                        item.getCreditCard() != null
                ))
                .toList();
    }

    private List<FinancialDashboardResponse.InstallmentCommitment>
            buildInstallmentCommitments(
                    List<FinancialCreditCardInstallment> installments
            ) {
        Map<UUID, List<FinancialCreditCardInstallment>> grouped =
                new LinkedHashMap<>();
        installments.stream()
                .filter(item -> item.getPurchase().getTotalInstallments() > 1)
                .forEach(item -> grouped
                        .computeIfAbsent(item.getPurchase().getId(), ignored ->
                                new ArrayList<>())
                        .add(item));

        return grouped.values().stream()
                .map(items -> {
                    items.sort(Comparator.comparing(item ->
                            item.getInvoice().getDueDate()));
                    FinancialCreditCardInstallment next = items.get(0);
                    return new FinancialDashboardResponse.InstallmentCommitment(
                            next.getPurchase().getId(),
                            next.getPurchase().getDescription(),
                            next.getPurchase().getCreditCard().getName(),
                            next.getInstallmentNumber(),
                            next.getPurchase().getTotalInstallments(),
                            items.size(),
                            next.getAmount(),
                            sumInstallmentAmounts(items),
                            next.getInvoice().getDueDate()
                    );
                })
                .sorted(Comparator.comparing(
                        FinancialDashboardResponse.InstallmentCommitment::nextDueDate
                ))
                .limit(8)
                .toList();
    }

    private List<FinancialDashboardResponse.BudgetProgress> buildBudgets(
            UUID familyId,
            LocalDate referenceMonth,
            List<FinancialTransaction> transactions,
            List<FinancialCreditCardInstallment> installments
    ) {
        return budgetRepository
                .findAllByFamily_IdAndReferenceMonthOrderByCategory_NameAsc(
                        familyId,
                        referenceMonth
                )
                .stream()
                .map(budget -> budgetProgress(budget, transactions, installments))
                .sorted(Comparator.comparing(
                        FinancialDashboardResponse.BudgetProgress::consumptionPercentage
                ).reversed())
                .toList();
    }

    private FinancialDashboardResponse.BudgetProgress budgetProgress(
            FinancialBudget budget,
            List<FinancialTransaction> transactions,
            List<FinancialCreditCardInstallment> installments
    ) {
        BigDecimal transactionAmount = transactions.stream()
                .filter(item -> item.getType() == FinancialTransactionType.EXPENSE)
                .filter(item -> item.getStatus() != FinancialTransactionStatus.CANCELLED)
                .filter(item -> item.getCategory() != null)
                .filter(item -> item.getCategory().getId()
                        .equals(budget.getCategory().getId()))
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cardAmount = installments.stream()
                .filter(item -> item.getPurchase().getCategory() != null)
                .filter(item -> item.getPurchase().getCategory().getId()
                        .equals(budget.getCategory().getId()))
                .map(FinancialCreditCardInstallment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal committed = transactionAmount.add(cardAmount);
        BigDecimal percentage = committed
                .multiply(BigDecimal.valueOf(100))
                .divide(budget.getLimitAmount(), 2, RoundingMode.HALF_UP);
        FinancialBudgetStatus status = committed.compareTo(
                budget.getLimitAmount()) > 0
                ? FinancialBudgetStatus.EXCEEDED
                : percentage.compareTo(budget.getAlertPercentage()) >= 0
                        ? FinancialBudgetStatus.ALERT
                        : FinancialBudgetStatus.SAFE;

        return new FinancialDashboardResponse.BudgetProgress(
                budget.getId(),
                budget.getCategory().getId(),
                budget.getCategory().getName(),
                budget.getLimitAmount(),
                committed,
                budget.getLimitAmount().subtract(committed),
                percentage,
                status
        );
    }

    private List<FinancialDashboardResponse.UpcomingItem> buildUpcomingItems(
            List<FinancialTransaction> transactions,
            List<FinancialCreditCardInstallment> installments,
            LocalDate today
    ) {
        List<FinancialDashboardResponse.UpcomingItem> items = new ArrayList<>();
        transactions.stream()
                .filter(FinancialTransaction::isPending)
                .forEach(item -> items.add(
                        new FinancialDashboardResponse.UpcomingItem(
                                "TRANSACTION",
                                item.getId(),
                                item.getDescription(),
                                item.getAccount().getName(),
                                effectiveDate(item),
                                item.getAmount(),
                                effectiveDate(item).isBefore(today)
                        )
                ));
        installments.forEach(item -> items.add(
                new FinancialDashboardResponse.UpcomingItem(
                        "INVOICE_INSTALLMENT",
                        item.getId(),
                        item.getPurchase().getDescription()
                                + " · Parcela "
                                + item.getInstallmentNumber()
                                + "/"
                                + item.getPurchase().getTotalInstallments(),
                        item.getPurchase().getCreditCard().getName(),
                        item.getInvoice().getDueDate(),
                        item.getAmount(),
                        item.getInvoice().getDueDate().isBefore(today)
                )
        ));

        return items.stream()
                .sorted(Comparator
                        .comparing(FinancialDashboardResponse.UpcomingItem::overdue)
                        .reversed()
                        .thenComparing(FinancialDashboardResponse.UpcomingItem::dueDate))
                .limit(10)
                .toList();
    }

    private BigDecimal forecastRecurrences(
            List<FinancialRecurrence> recurrences,
            LocalDate from,
            LocalDate to,
            FinancialTransactionType type
    ) {
        BigDecimal total = BigDecimal.ZERO;
        for (FinancialRecurrence recurrence : recurrences) {
            if (recurrence.getType() != type) {
                continue;
            }

            LocalDate date = recurrence.getNextGenerationDate();
            int remaining = recurrence.getRemainingOccurrences() == null
                    ? Integer.MAX_VALUE
                    : recurrence.getRemainingOccurrences();

            while (remaining > 0 && !date.isAfter(to)) {
                if (recurrence.getEndDate() != null
                        && date.isAfter(recurrence.getEndDate())) {
                    break;
                }
                if (!date.isBefore(from)) {
                    total = total.add(recurrence.getAmount());
                }
                date = advance(date, recurrence);
                remaining--;
            }
        }
        return total;
    }

    private LocalDate advance(LocalDate date, FinancialRecurrence recurrence) {
        return switch (recurrence.getFrequency()) {
            case DAILY -> date.plusDays(recurrence.getInterval());
            case WEEKLY -> date.plusWeeks(recurrence.getInterval());
            case MONTHLY -> date.plusMonths(recurrence.getInterval());
            case YEARLY -> date.plusYears(recurrence.getInterval());
        };
    }

    private BigDecimal calculateTotalAccountBalance(UUID familyId) {
        return accountRepository
                .findAllByFamily_IdOrderByActiveDescNameAsc(familyId)
                .stream()
                .filter(FinancialAccount::isActive)
                .filter(FinancialAccount::isIncludeInTotal)
                .map(account -> account.getInitialBalance().add(
                        zeroIfNull(accountRepository
                                .calculatePaidMovementBalance(account.getId()))
                ))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumTransactions(
            List<FinancialTransaction> transactions,
            FinancialTransactionType type,
            FinancialTransactionStatus status
    ) {
        return transactions.stream()
                .filter(item -> item.getType() == type)
                .filter(item -> item.getStatus() == status)
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumPaidInstallments(
            List<FinancialCreditCardInstallment> installments
    ) {
        return installments.stream()
                .filter(item -> item.getInvoice().isPaid())
                .map(FinancialCreditCardInstallment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumPendingInstallments(
            List<FinancialCreditCardInstallment> installments
    ) {
        return installments.stream()
                .filter(this::isPendingInstallment)
                .map(FinancialCreditCardInstallment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private boolean isPendingInstallment(FinancialCreditCardInstallment item) {
        FinancialCreditCardInvoiceStatus status = item.getInvoice().getStatus();
        return status == FinancialCreditCardInvoiceStatus.OPEN
                || status == FinancialCreditCardInvoiceStatus.CLOSED;
    }

    private BigDecimal sumTransactionAmounts(List<FinancialTransaction> items) {
        return items.stream().map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumInstallmentAmounts(
            List<FinancialCreditCardInstallment> items
    ) {
        return items.stream().map(FinancialCreditCardInstallment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private LocalDate effectiveDate(FinancialTransaction transaction) {
        return transaction.getDueDate() == null
                ? transaction.getTransactionDate()
                : transaction.getDueDate();
    }

    private List<FinancialCategorySummaryResponse> summarizeIncomeByCategory(
            List<FinancialTransaction> transactions,
            BigDecimal totalIncome
    ) {
        Map<CategoryKey, CategoryAccumulator> grouped = new LinkedHashMap<>();
        transactions.stream()
                .filter(FinancialTransaction::isPaid)
                .filter(item -> item.getType() == FinancialTransactionType.INCOME)
                .forEach(item -> addCategoryAmount(
                        grouped, item.getCategory(), item.getAmount()
                ));
        return buildCategorySummaries(
                grouped, FinancialTransactionType.INCOME, totalIncome
        );
    }

    private List<FinancialCategorySummaryResponse> summarizeExpenseByCategory(
            List<FinancialTransaction> transactions,
            List<FinancialCreditCardInstallment> installments,
            BigDecimal totalExpense
    ) {
        Map<CategoryKey, CategoryAccumulator> grouped = new LinkedHashMap<>();
        transactions.stream()
                .filter(FinancialTransaction::isPaid)
                .filter(item -> item.getType() == FinancialTransactionType.EXPENSE)
                .forEach(item -> addCategoryAmount(
                        grouped, item.getCategory(), item.getAmount()
                ));
        installments.stream()
                .filter(item -> item.getInvoice().isPaid())
                .forEach(item -> addCategoryAmount(
                        grouped,
                        item.getPurchase().getCategory(),
                        item.getAmount()
                ));
        return buildCategorySummaries(
                grouped, FinancialTransactionType.EXPENSE, totalExpense
        );
    }

    private void addCategoryAmount(
            Map<CategoryKey, CategoryAccumulator> grouped,
            FinancialCategory category,
            BigDecimal amount
    ) {
        CategoryKey key = category == null
                ? new CategoryKey(null, "Sem categoria", null, null)
                : new CategoryKey(
                        category.getId(), category.getName(),
                        category.getColor(), category.getIcon()
                );
        grouped.computeIfAbsent(key, ignored -> new CategoryAccumulator())
                .add(amount);
    }

    private List<FinancialCategorySummaryResponse> buildCategorySummaries(
            Map<CategoryKey, CategoryAccumulator> grouped,
            FinancialTransactionType type,
            BigDecimal totalForType
    ) {
        List<FinancialCategorySummaryResponse> summaries = new ArrayList<>();
        grouped.forEach((key, accumulator) -> {
            BigDecimal percentage = totalForType.compareTo(BigDecimal.ZERO) > 0
                    ? accumulator.total.multiply(BigDecimal.valueOf(100))
                            .divide(totalForType, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            summaries.add(new FinancialCategorySummaryResponse(
                    key.id(), key.name(), key.color(), key.icon(), type,
                    accumulator.count, accumulator.total, percentage
            ));
        });
        return summaries.stream()
                .sorted(Comparator.comparing(
                        FinancialCategorySummaryResponse::total
                ).reversed())
                .toList();
    }

    private void validatePeriod(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new IllegalArgumentException(
                    "Informe o início e o final do período"
            );
        }
        if (to.isBefore(from)) {
            throw new IllegalArgumentException(
                    "O final do período não pode ser anterior ao início"
            );
        }
        if (ChronoUnit.DAYS.between(from, to) > MAXIMUM_PERIOD_IN_DAYS) {
            throw new IllegalArgumentException(
                    "O período consultado não pode ultrapassar 366 dias"
            );
        }
    }

    private record CategoryKey(UUID id, String name, String color, String icon) {
    }

    private static final class CategoryAccumulator {
        private long count;
        private BigDecimal total = BigDecimal.ZERO;

        private void add(BigDecimal amount) {
            count++;
            total = total.add(amount);
        }
    }
}