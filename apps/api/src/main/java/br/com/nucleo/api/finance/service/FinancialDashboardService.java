package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialAccount;
import br.com.nucleo.api.finance.domain.FinancialCategory;
import br.com.nucleo.api.finance.domain.FinancialTransaction;
import br.com.nucleo.api.finance.domain.FinancialTransactionStatus;
import br.com.nucleo.api.finance.domain.FinancialTransactionType;
import br.com.nucleo.api.finance.dto.FinancialCategorySummaryResponse;
import br.com.nucleo.api.finance.dto.FinancialDashboardResponse;
import br.com.nucleo.api.finance.repository.FinancialAccountRepository;
import br.com.nucleo.api.finance.repository.FinancialTransactionRepository;

import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.family.domain.FamilyMembership;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialDashboardService {

    private static final long MAXIMUM_PERIOD_IN_DAYS = 366;

    private final FamilyAccessService familyAccessService;
    private final FinancialAccountRepository accountRepository;
    private final FinancialTransactionRepository transactionRepository;

    public FinancialDashboardService(
            FamilyAccessService familyAccessService,
            FinancialAccountRepository accountRepository,
            FinancialTransactionRepository transactionRepository
    ) {
        this.familyAccessService = familyAccessService;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public FinancialDashboardResponse getDashboard(
            UUID currentUserId,
            LocalDate from,
            LocalDate to
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        validatePeriod(from, to);

        UUID familyId = membership.getFamily().getId();

        List<FinancialTransaction> transactions =
                transactionRepository.search(
                        familyId,
                        from,
                        to,
                        null,
                        null,
                        null,
                        null
                );

        BigDecimal totalIncome = sum(
                transactions,
                FinancialTransactionType.INCOME,
                FinancialTransactionStatus.PAID
        );

        BigDecimal totalExpense = sum(
                transactions,
                FinancialTransactionType.EXPENSE,
                FinancialTransactionStatus.PAID
        );

        BigDecimal pendingIncome = sum(
                transactions,
                FinancialTransactionType.INCOME,
                FinancialTransactionStatus.PENDING
        );

        BigDecimal pendingExpense = sum(
                transactions,
                FinancialTransactionType.EXPENSE,
                FinancialTransactionStatus.PENDING
        );

        LocalDate today = LocalDate.now();

        List<FinancialTransaction> overdueExpenses =
                transactions.stream()
                        .filter(transaction ->
                                transaction.getType()
                                        == FinancialTransactionType.EXPENSE
                        )
                        .filter(FinancialTransaction::isPending)
                        .filter(transaction ->
                                transaction.getDueDate() != null
                        )
                        .filter(transaction ->
                                transaction.getDueDate().isBefore(today)
                        )
                        .toList();

        BigDecimal overdueExpense = overdueExpenses.stream()
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAccountBalance =
                calculateTotalAccountBalance(familyId);

        return new FinancialDashboardResponse(
                from,
                to,
                totalAccountBalance,
                totalIncome,
                totalExpense,
                totalIncome.subtract(totalExpense),
                pendingIncome,
                pendingExpense,
                overdueExpense,
                overdueExpenses.size(),
                summarizeByCategory(
                        transactions,
                        FinancialTransactionType.INCOME,
                        totalIncome
                ),
                summarizeByCategory(
                        transactions,
                        FinancialTransactionType.EXPENSE,
                        totalExpense
                )
        );
    }

    private BigDecimal calculateTotalAccountBalance(
            UUID familyId
    ) {
        return accountRepository
                .findAllByFamily_IdOrderByActiveDescNameAsc(
                        familyId
                )
                .stream()
                .filter(FinancialAccount::isActive)
                .filter(FinancialAccount::isIncludeInTotal)
                .map(account -> {
                    BigDecimal movements =
                            accountRepository
                                    .calculatePaidMovementBalance(
                                            account.getId()
                                    );

                    if (movements == null) {
                        movements = BigDecimal.ZERO;
                    }

                    return account
                            .getInitialBalance()
                            .add(movements);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sum(
            List<FinancialTransaction> transactions,
            FinancialTransactionType type,
            FinancialTransactionStatus status
    ) {
        return transactions.stream()
                .filter(transaction ->
                        transaction.getType() == type
                )
                .filter(transaction ->
                        transaction.getStatus() == status
                )
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<FinancialCategorySummaryResponse>
            summarizeByCategory(
                    List<FinancialTransaction> transactions,
                    FinancialTransactionType type,
                    BigDecimal totalForType
            ) {
        Map<CategoryKey, CategoryAccumulator> grouped =
                new LinkedHashMap<>();

        transactions.stream()
                .filter(FinancialTransaction::isPaid)
                .filter(transaction ->
                        transaction.getType() == type
                )
                .forEach(transaction -> {
                    FinancialCategory category =
                            transaction.getCategory();

                    CategoryKey key;

                    if (category == null) {
                        key = new CategoryKey(
                                null,
                                "Sem categoria",
                                null,
                                null
                        );
                    } else {
                        key = new CategoryKey(
                                category.getId(),
                                category.getName(),
                                category.getColor(),
                                category.getIcon()
                        );
                    }

                    grouped.computeIfAbsent(
                            key,
                            ignored ->
                                    new CategoryAccumulator()
                    ).add(transaction.getAmount());
                });

        List<FinancialCategorySummaryResponse> summaries =
                new ArrayList<>();

        grouped.forEach((key, accumulator) -> {
            BigDecimal percentage = BigDecimal.ZERO;

            if (totalForType.compareTo(BigDecimal.ZERO) > 0) {
                percentage = accumulator.total
                        .multiply(BigDecimal.valueOf(100))
                        .divide(
                                totalForType,
                                2,
                                RoundingMode.HALF_UP
                        );
            }

            summaries.add(
                    new FinancialCategorySummaryResponse(
                            key.id(),
                            key.name(),
                            key.color(),
                            key.icon(),
                            type,
                            accumulator.count,
                            accumulator.total,
                            percentage
                    )
            );
        });

        return summaries.stream()
                .sorted(
                        Comparator.comparing(
                                FinancialCategorySummaryResponse::total
                        ).reversed()
                )
                .toList();
    }

    private void validatePeriod(
            LocalDate from,
            LocalDate to
    ) {
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

        if (ChronoUnit.DAYS.between(from, to)
                > MAXIMUM_PERIOD_IN_DAYS) {
            throw new IllegalArgumentException(
                    "O período consultado não pode ultrapassar 366 dias"
            );
        }
    }

    private record CategoryKey(
            UUID id,
            String name,
            String color,
            String icon
    ) {
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