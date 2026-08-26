package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.family.domain.Family;
import br.com.nucleo.api.finance.domain.FinancialBudget;
import br.com.nucleo.api.finance.domain.FinancialCategory;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInstallment;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoiceStatus;
import br.com.nucleo.api.finance.domain.FinancialTransactionStatus;
import br.com.nucleo.api.finance.repository.FinancialBudgetRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInstallmentRepository;
import br.com.nucleo.api.finance.repository.FinancialTransactionRepository;
import br.com.nucleo.api.notification.domain.NotificationType;
import br.com.nucleo.api.notification.service.NotificationService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialBudgetAlertService {

    private final FinancialBudgetRepository budgetRepository;
    private final FinancialTransactionRepository transactionRepository;
    private final FinancialCreditCardInstallmentRepository installmentRepository;
    private final NotificationService notificationService;

    public FinancialBudgetAlertService(
            FinancialBudgetRepository budgetRepository,
            FinancialTransactionRepository transactionRepository,
            FinancialCreditCardInstallmentRepository installmentRepository,
            NotificationService notificationService
    ) {
        this.budgetRepository = budgetRepository;
        this.transactionRepository = transactionRepository;
        this.installmentRepository = installmentRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public void evaluate(
            Family family,
            FinancialCategory category,
            LocalDate referenceDate
    ) {
        if (family == null
                || category == null
                || referenceDate == null) {
            return;
        }

        LocalDate referenceMonth
                = referenceDate.withDayOfMonth(1);

        budgetRepository
                .findAllByFamily_IdAndReferenceMonthOrderByCategory_NameAsc(
                        family.getId(),
                        referenceMonth
                )
                .stream()
                .filter(budget
                        -> budget.getCategory()
                        .getId()
                        .equals(category.getId())
                )
                .findFirst()
                .ifPresent(this::evaluateBudget);
    }

    private void evaluateBudget(
            FinancialBudget budget
    ) {
        BigDecimal committedAmount
                = calculateCommittedAmount(budget);

        BigDecimal usagePercentage
                = committedAmount
                        .multiply(BigDecimal.valueOf(100))
                        .divide(
                                budget.getLimitAmount(),
                                2,
                                RoundingMode.HALF_UP
                        );

        BigDecimal alertPercentage
                = budget.getAlertPercentage();

        if (usagePercentage.compareTo(
                alertPercentage
        ) < 0) {
            return;
        }

        boolean exceeded
                = committedAmount.compareTo(
                        budget.getLimitAmount()
                ) > 0;

        String level = exceeded
                ? "exceeded"
                : "warning";

        String title = exceeded
                ? "Orçamento ultrapassado"
                : "Alerta de orçamento";

        String message = exceeded
                ? "A categoria “"
                + budget.getCategory().getName()
                + "” ultrapassou o orçamento de "
                + budget.getLimitAmount()
                + "."
                : "A categoria “"
                + budget.getCategory().getName()
                + "” atingiu "
                + usagePercentage
                + "% do orçamento mensal.";

        notificationService.notifyActiveFamilyMembers(
                budget.getFamily(),
                null,
                NotificationType.FINANCIAL_BUDGET_ALERT,
                title,
                message,
                "/financas/orcamentos?budgetId="
                + budget.getId(),
                budget.getId(),
                "financial-budget-alert:"
                + budget.getId()
                + ":"
                + level
        );
    }

    private BigDecimal calculateCommittedAmount(
            FinancialBudget budget
    ) {
        LocalDate from = budget.getReferenceMonth();
        LocalDate to = from.withDayOfMonth(
                from.lengthOfMonth()
        );

        BigDecimal paidAmount
                = transactionRepository.calculateCategoryExpense(
                        budget.getFamily().getId(),
                        budget.getCategory().getId(),
                        FinancialTransactionStatus.PAID,
                        from,
                        to
                );

        BigDecimal pendingAmount
                = transactionRepository.calculateCategoryExpense(
                        budget.getFamily().getId(),
                        budget.getCategory().getId(),
                        FinancialTransactionStatus.PENDING,
                        from,
                        to
                );

        BigDecimal cardAmount
                = calculateCreditCardAmount(budget);

        return paidAmount
                .add(pendingAmount)
                .add(cardAmount);
    }

    private BigDecimal calculateCreditCardAmount(
            FinancialBudget budget
    ) {
        List<FinancialCreditCardInstallment> installments
                = installmentRepository.findAllForReferenceMonth(
                        budget.getFamily().getId(),
                        budget.getReferenceMonth()
                );

        return installments.stream()
                .filter(installment -> {
                    FinancialCategory category
                            = installment
                                    .getPurchase()
                                    .getCategory();

                    return category != null
                            && category.getId().equals(
                                    budget.getCategory().getId()
                            );
                })
                .filter(installment -> {
                    FinancialCreditCardInvoiceStatus status
                            = installment
                                    .getInvoice()
                                    .getStatus();

                    return status
                            == FinancialCreditCardInvoiceStatus.OPEN
                            || status
                            == FinancialCreditCardInvoiceStatus.CLOSED
                            || status
                            == FinancialCreditCardInvoiceStatus.PAID;
                })
                .map(FinancialCreditCardInstallment::getSignedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
