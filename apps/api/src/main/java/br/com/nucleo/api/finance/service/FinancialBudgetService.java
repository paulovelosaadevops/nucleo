package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialBudget;
import br.com.nucleo.api.finance.domain.FinancialCategory;
import br.com.nucleo.api.finance.domain.FinancialCategoryType;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInstallment;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoiceStatus;
import br.com.nucleo.api.finance.domain.FinancialTransactionStatus;
import br.com.nucleo.api.finance.dto.CreateFinancialBudgetRequest;
import br.com.nucleo.api.finance.dto.FinancialBudgetResponse;
import br.com.nucleo.api.finance.dto.UpdateFinancialBudgetRequest;
import br.com.nucleo.api.finance.repository.FinancialBudgetRepository;
import br.com.nucleo.api.finance.repository.FinancialCategoryRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInstallmentRepository;
import br.com.nucleo.api.finance.repository.FinancialTransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialBudgetService {

    private final FamilyAccessService familyAccessService;
    private final FinancialCategoryRepository categoryRepository;
    private final FinancialBudgetRepository budgetRepository;
    private final FinancialTransactionRepository transactionRepository;
    private final FinancialCreditCardInstallmentRepository
            installmentRepository;

    public FinancialBudgetService(
            FamilyAccessService familyAccessService,
            FinancialCategoryRepository categoryRepository,
            FinancialBudgetRepository budgetRepository,
            FinancialTransactionRepository transactionRepository,
            FinancialCreditCardInstallmentRepository
                    installmentRepository
    ) {
        this.familyAccessService = familyAccessService;
        this.categoryRepository = categoryRepository;
        this.budgetRepository = budgetRepository;
        this.transactionRepository = transactionRepository;
        this.installmentRepository = installmentRepository;
    }

    @Transactional
    public FinancialBudgetResponse create(
            UUID currentUserId,
            CreateFinancialBudgetRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        LocalDate referenceMonth =
                normalizeMonth(request.referenceMonth());

        FinancialCategory category =
                requireExpenseCategory(
                        request.categoryId(),
                        membership.getFamily().getId()
                );

        if (
                budgetRepository
                        .existsByFamily_IdAndCategory_IdAndReferenceMonth(
                                membership.getFamily().getId(),
                                category.getId(),
                                referenceMonth
                        )
        ) {
            throw new IllegalArgumentException(
                    "Já existe orçamento para esta categoria neste mês"
            );
        }

        FinancialBudget budget = FinancialBudget.create(
                membership.getFamily(),
                category,
                referenceMonth,
                request.limitAmount(),
                request.alertPercentage()
        );

        budgetRepository.save(budget);

        return toResponse(budget);
    }

    @Transactional(readOnly = true)
    public List<FinancialBudgetResponse> list(
            UUID currentUserId,
            LocalDate referenceMonth
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        LocalDate month = normalizeMonth(referenceMonth);

        return budgetRepository
                .findAllByFamily_IdAndReferenceMonthOrderByCategory_NameAsc(
                        membership.getFamily().getId(),
                        month
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public FinancialBudgetResponse update(
            UUID currentUserId,
            UUID budgetId,
            UpdateFinancialBudgetRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialBudget budget = requireBudget(
                budgetId,
                membership.getFamily().getId()
        );

        budget.update(
                request.limitAmount(),
                request.alertPercentage()
        );

        return toResponse(budget);
    }

    @Transactional
    public void delete(
            UUID currentUserId,
            UUID budgetId
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialBudget budget = requireBudget(
                budgetId,
                membership.getFamily().getId()
        );

        budgetRepository.delete(budget);
    }

    private FinancialBudget requireBudget(
            UUID budgetId,
            UUID familyId
    ) {
        return budgetRepository
                .findByIdAndFamily_Id(budgetId, familyId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Orçamento financeiro não encontrado"
                        )
                );
    }

    private FinancialCategory requireExpenseCategory(
            UUID categoryId,
            UUID familyId
    ) {
        FinancialCategory category = categoryRepository
                .findByIdAndFamily_Id(categoryId, familyId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Categoria financeira não encontrada"
                        )
                );

        if (category.getType()
                != FinancialCategoryType.EXPENSE) {
            throw new IllegalArgumentException(
                    "Orçamentos só podem utilizar categorias de despesa"
            );
        }

        if (!category.isActive()) {
            throw new IllegalArgumentException(
                    "A categoria selecionada está inativa"
            );
        }

        return category;
    }

    private FinancialBudgetResponse toResponse(
            FinancialBudget budget
    ) {
        LocalDate from = budget.getReferenceMonth();
        LocalDate to = from.withDayOfMonth(
                from.lengthOfMonth()
        );

        BigDecimal paidAmount =
                transactionRepository.calculateCategoryExpense(
                        budget.getFamily().getId(),
                        budget.getCategory().getId(),
                        FinancialTransactionStatus.PAID,
                        from,
                        to
                );

        BigDecimal pendingAmount =
                transactionRepository.calculateCategoryExpense(
                        budget.getFamily().getId(),
                        budget.getCategory().getId(),
                        FinancialTransactionStatus.PENDING,
                        from,
                        to
                );

        List<FinancialCreditCardInstallment> installments =
                installmentRepository.findAllForReferenceMonth(
                        budget.getFamily().getId(),
                        budget.getReferenceMonth()
                );

        for (FinancialCreditCardInstallment installment
                : installments) {
            FinancialCategory category =
                    installment.getPurchase().getCategory();

            if (
                    category == null
                            || !category.getId().equals(
                            budget.getCategory().getId()
                    )
            ) {
                continue;
            }

            FinancialCreditCardInvoiceStatus invoiceStatus =
                    installment.getInvoice().getStatus();

            if (
                    invoiceStatus
                            == FinancialCreditCardInvoiceStatus.PAID
            ) {
                paidAmount = paidAmount.add(
                        installment.getSignedAmount()
                );
            } else if (
                    invoiceStatus
                            == FinancialCreditCardInvoiceStatus.OPEN
                            || invoiceStatus
                            == FinancialCreditCardInvoiceStatus.CLOSED
            ) {
                pendingAmount = pendingAmount.add(
                        installment.getSignedAmount()
                );
            }
        }

        return FinancialBudgetResponse.from(
                budget,
                paidAmount,
                pendingAmount
        );
    }

    private LocalDate normalizeMonth(LocalDate value) {
        if (value == null) {
            throw new IllegalArgumentException(
                    "Informe o mês de referência"
            );
        }

        return value.withDayOfMonth(1);
    }
}
