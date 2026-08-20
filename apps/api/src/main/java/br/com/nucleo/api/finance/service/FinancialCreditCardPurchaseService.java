package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.common.error.ForbiddenOperationException;
import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.domain.FamilyRole;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialCategory;
import br.com.nucleo.api.finance.domain.FinancialCategoryType;
import br.com.nucleo.api.finance.domain.FinancialCreditCard;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInstallment;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoice;
import br.com.nucleo.api.finance.domain.FinancialCreditCardPurchase;
import br.com.nucleo.api.finance.dto.CreateFinancialCreditCardPurchaseRequest;
import br.com.nucleo.api.finance.dto.FinancialCreditCardInstallmentResponse;
import br.com.nucleo.api.finance.dto.FinancialCreditCardPurchaseResponse;
import br.com.nucleo.api.finance.dto.UpdateFinancialCreditCardPurchaseRequest;
import br.com.nucleo.api.finance.repository.FinancialCategoryRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInstallmentRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInvoiceRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardPurchaseRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialCreditCardPurchaseService {

    private static final long MAXIMUM_SEARCH_PERIOD = 366;

    private final FamilyAccessService familyAccessService;
    private final FinancialCreditCardRepository cardRepository;
    private final FinancialCategoryRepository categoryRepository;
    private final FinancialCreditCardPurchaseRepository
            purchaseRepository;
    private final FinancialCreditCardInvoiceRepository
            invoiceRepository;
    private final FinancialCreditCardInstallmentRepository
            installmentRepository;
    private final FinancialBudgetAlertService budgetAlertService;

    public FinancialCreditCardPurchaseService(
            FamilyAccessService familyAccessService,
            FinancialCreditCardRepository cardRepository,
            FinancialCategoryRepository categoryRepository,
            FinancialCreditCardPurchaseRepository purchaseRepository,
            FinancialCreditCardInvoiceRepository invoiceRepository,
            FinancialCreditCardInstallmentRepository
                    installmentRepository,
            FinancialBudgetAlertService budgetAlertService
    ) {
        this.familyAccessService = familyAccessService;
        this.cardRepository = cardRepository;
        this.categoryRepository = categoryRepository;
        this.purchaseRepository = purchaseRepository;
        this.invoiceRepository = invoiceRepository;
        this.installmentRepository = installmentRepository;
        this.budgetAlertService = budgetAlertService;
    }

    @Transactional
    public FinancialCreditCardPurchaseResponse create(
            UUID currentUserId,
            CreateFinancialCreditCardPurchaseRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialCreditCard card = requireActiveCard(
                request.creditCardId(),
                membership.getFamily().getId()
        );

        FinancialCategory category = findExpenseCategory(
                request.categoryId(),
                membership.getFamily().getId()
        );

        validateInstallmentDistribution(
                request.totalAmount(),
                request.totalInstallments()
        );

        FinancialCreditCardPurchase purchase =
                FinancialCreditCardPurchase.create(
                        membership.getFamily(),
                        card,
                        category,
                        request.description(),
                        request.totalAmount(),
                        request.purchaseDate(),
                        request.totalInstallments(),
                        request.notes(),
                        membership.getUser()
                );

        purchaseRepository.save(purchase);

        List<BigDecimal> installmentAmounts =
                distributeAmount(
                        request.totalAmount(),
                        request.totalInstallments()
                );

        YearMonth firstDueMonth =
                calculateFirstDueMonth(
                        card,
                        request.purchaseDate()
                );

        List<FinancialCreditCardInstallment> installments =
                new ArrayList<>();

        for (
                int index = 0;
                index < request.totalInstallments();
                index++
        ) {
            YearMonth dueMonth =
                    firstDueMonth.plusMonths(index);

            FinancialCreditCardInvoice invoice =
                    findOrCreateInvoice(
                            card,
                            dueMonth
                    );

            FinancialCreditCardInstallment installment =
                    FinancialCreditCardInstallment.create(
                            purchase,
                            invoice,
                            index + 1,
                            installmentAmounts.get(index)
                    );

            installments.add(installment);
        }

        installmentRepository.saveAll(installments);

        evaluateBudgetAlerts(
                membership,
                category,
                installments
        );

        return toResponse(
                purchase,
                installments
        );
    }

    @Transactional(readOnly = true)
    public List<FinancialCreditCardPurchaseResponse> search(
            UUID currentUserId,
            LocalDate from,
            LocalDate to
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        validateSearchPeriod(
                from,
                to
        );

        return purchaseRepository
                .findAllByFamily_IdAndPurchaseDateBetweenOrderByPurchaseDateDescCreatedAtDesc(
                        membership.getFamily().getId(),
                        from,
                        to
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FinancialCreditCardPurchaseResponse findById(
            UUID currentUserId,
            UUID purchaseId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialCreditCardPurchase purchase =
                requirePurchase(
                        purchaseId,
                        membership.getFamily().getId()
                );

        return toResponse(purchase);
    }

    @Transactional
    public FinancialCreditCardPurchaseResponse update(
            UUID currentUserId,
            UUID purchaseId,
            UpdateFinancialCreditCardPurchaseRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialCreditCardPurchase purchase =
                requirePurchase(
                        purchaseId,
                        membership.getFamily().getId()
                );

        List<FinancialCreditCardInstallment> installments =
                findInstallments(purchaseId);

        ensureNoPaidInvoice(installments);

        FinancialCategory category = findExpenseCategory(
                request.categoryId(),
                membership.getFamily().getId()
        );

        purchase.updateDetails(
                category,
                request.description(),
                request.notes()
        );

        evaluateBudgetAlerts(
                membership,
                category,
                installments
        );

        return toResponse(
                purchase,
                installments
        );
    }

    @Transactional
    public FinancialCreditCardPurchaseResponse cancel(
            UUID currentUserId,
            UUID purchaseId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialCreditCardPurchase purchase =
                requirePurchase(
                        purchaseId,
                        membership.getFamily().getId()
                );

        List<FinancialCreditCardInstallment> installments =
                findInstallments(purchaseId);

        ensureNoPaidInvoice(installments);

        purchase.cancel();

        installments.forEach(
                FinancialCreditCardInstallment::cancel
        );

        return toResponse(
                purchase,
                installments
        );
    }

    @Transactional
    public FinancialCreditCardPurchaseResponse restore(
            UUID currentUserId,
            UUID purchaseId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialCreditCardPurchase purchase =
                requirePurchase(
                        purchaseId,
                        membership.getFamily().getId()
                );

        List<FinancialCreditCardInstallment> installments =
                findInstallments(purchaseId);

        ensureNoPaidOrCancelledInvoice(installments);

        purchase.restore();

        installments.forEach(
                FinancialCreditCardInstallment::restore
        );

        evaluateBudgetAlerts(
                membership,
                purchase.getCategory(),
                installments
        );

        return toResponse(
                purchase,
                installments
        );
    }

    @Transactional
    public void delete(
            UUID currentUserId,
            UUID purchaseId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialCreditCardPurchase purchase =
                requirePurchase(
                        purchaseId,
                        membership.getFamily().getId()
                );

        requireDeletePermission(
                purchase,
                membership
        );

        List<FinancialCreditCardInstallment> installments =
                findInstallments(purchaseId);

        ensureNoPaidInvoice(installments);

        purchaseRepository.delete(purchase);
    }

    private FinancialCreditCard requireActiveCard(
            UUID cardId,
            UUID familyId
    ) {
        FinancialCreditCard card = cardRepository
                .findByIdAndFamily_Id(
                        cardId,
                        familyId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Cartão de crédito não encontrado"
                        )
                );

        if (!card.isActive()) {
            throw new IllegalArgumentException(
                    "O cartão selecionado está inativo"
            );
        }

        return card;
    }

    private FinancialCreditCardPurchase requirePurchase(
            UUID purchaseId,
            UUID familyId
    ) {
        return purchaseRepository
                .findByIdAndFamily_Id(
                        purchaseId,
                        familyId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Compra no cartão não encontrada"
                        )
                );
    }

    private FinancialCategory findExpenseCategory(
            UUID categoryId,
            UUID familyId
    ) {
        if (categoryId == null) {
            return null;
        }

        FinancialCategory category = categoryRepository
                .findByIdAndFamily_Id(
                        categoryId,
                        familyId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Categoria financeira não encontrada"
                        )
                );

        if (!category.isActive()) {
            throw new IllegalArgumentException(
                    "A categoria selecionada está inativa"
            );
        }

        if (
                category.getType()
                        != FinancialCategoryType.EXPENSE
        ) {
            throw new IllegalArgumentException(
                    "Compras no cartão exigem categoria de despesa"
            );
        }

        return category;
    }

    private FinancialCreditCardInvoice findOrCreateInvoice(
            FinancialCreditCard card,
            YearMonth dueMonth
    ) {
        LocalDate referenceMonth =
                dueMonth.atDay(1);

        return invoiceRepository
                .findByCreditCard_IdAndReferenceMonth(
                        card.getId(),
                        referenceMonth
                )
                .orElseGet(() -> {
                    YearMonth closingMonth =
                            card.getDueDay()
                                    > card.getClosingDay()
                                    ? dueMonth
                                    : dueMonth.minusMonths(1);

                    LocalDate closingDate =
                            closingMonth.atDay(
                                    card.getClosingDay()
                            );

                    LocalDate dueDate =
                            dueMonth.atDay(
                                    card.getDueDay()
                            );

                    FinancialCreditCardInvoice invoice =
                            FinancialCreditCardInvoice.create(
                                    card,
                                    referenceMonth,
                                    closingDate,
                                    dueDate
                            );

                    return invoiceRepository.save(
                            invoice
                    );
                });
    }

    private YearMonth calculateFirstDueMonth(
            FinancialCreditCard card,
            LocalDate purchaseDate
    ) {
        YearMonth closingMonth =
                YearMonth.from(purchaseDate);

        if (
                purchaseDate.getDayOfMonth()
                        > card.getClosingDay()
        ) {
            closingMonth =
                    closingMonth.plusMonths(1);
        }

        if (
                card.getDueDay()
                        > card.getClosingDay()
        ) {
            return closingMonth;
        }

        return closingMonth.plusMonths(1);
    }

    private List<BigDecimal> distributeAmount(
            BigDecimal totalAmount,
            int installmentCount
    ) {
        long totalCents = totalAmount
                .setScale(
                        2,
                        RoundingMode.UNNECESSARY
                )
                .movePointRight(2)
                .longValueExact();

        long baseCents =
                totalCents / installmentCount;

        long remainder =
                totalCents % installmentCount;

        List<BigDecimal> amounts =
                new ArrayList<>();

        for (
                int index = 0;
                index < installmentCount;
                index++
        ) {
            long cents = baseCents;

            if (index < remainder) {
                cents++;
            }

            amounts.add(
                    BigDecimal.valueOf(
                            cents,
                            2
                    )
            );
        }

        return amounts;
    }

    private void validateInstallmentDistribution(
            BigDecimal totalAmount,
            int installmentCount
    ) {
        long totalCents = totalAmount
                .setScale(
                        2,
                        RoundingMode.UNNECESSARY
                )
                .movePointRight(2)
                .longValueExact();

        if (totalCents < installmentCount) {
            throw new IllegalArgumentException(
                    "O valor não pode ser dividido na quantidade informada de parcelas"
            );
        }
    }

    private void validateSearchPeriod(
            LocalDate from,
            LocalDate to
    ) {
        if (from == null || to == null) {
            throw new IllegalArgumentException(
                    "Informe o início e o fim do período"
            );
        }

        if (to.isBefore(from)) {
            throw new IllegalArgumentException(
                    "O final do período não pode ser anterior ao início"
            );
        }

        if (
                ChronoUnit.DAYS.between(from, to)
                        > MAXIMUM_SEARCH_PERIOD
        ) {
            throw new IllegalArgumentException(
                    "O período não pode ultrapassar 366 dias"
            );
        }
    }

    private void ensureNoPaidInvoice(
            List<FinancialCreditCardInstallment> installments
    ) {
        boolean containsPaidInvoice =
                installments.stream()
                        .anyMatch(installment ->
                                installment
                                        .getInvoice()
                                        .isPaid()
                        );

        if (containsPaidInvoice) {
            throw new IllegalArgumentException(
                    "A compra possui parcela em fatura paga e não pode ser alterada"
            );
        }
    }

    private void ensureNoPaidOrCancelledInvoice(
            List<FinancialCreditCardInstallment> installments
    ) {
        boolean blocked =
                installments.stream()
                        .anyMatch(installment ->
                                installment
                                        .getInvoice()
                                        .isPaid()
                                        || installment
                                        .getInvoice()
                                        .isCancelled()
                        );

        if (blocked) {
            throw new IllegalArgumentException(
                    "A compra possui parcela em fatura encerrada"
            );
        }
    }

    private List<FinancialCreditCardInstallment>
            findInstallments(
                    UUID purchaseId
            ) {
        return installmentRepository
                .findAllByPurchase_IdOrderByInstallmentNumberAsc(
                        purchaseId
                );
    }

    private FinancialCreditCardPurchaseResponse toResponse(
            FinancialCreditCardPurchase purchase
    ) {
        return toResponse(
                purchase,
                findInstallments(purchase.getId())
        );
    }

    private FinancialCreditCardPurchaseResponse toResponse(
            FinancialCreditCardPurchase purchase,
            List<FinancialCreditCardInstallment> installments
    ) {
        List<FinancialCreditCardInstallmentResponse> responses =
                installments.stream()
                        .map(
                                FinancialCreditCardInstallmentResponse
                                        ::from
                        )
                        .toList();

        return FinancialCreditCardPurchaseResponse.from(
                purchase,
                responses
        );
    }

    private void evaluateBudgetAlerts(
            FamilyMembership membership,
            FinancialCategory category,
            List<FinancialCreditCardInstallment> installments
    ) {
        if (
                category == null
                        || installments.isEmpty()
        ) {
            return;
        }

        installments.stream()
                .map(installment ->
                        installment
                                .getInvoice()
                                .getReferenceMonth()
                )
                .distinct()
                .forEach(referenceMonth ->
                        budgetAlertService.evaluate(
                                membership.getFamily(),
                                category,
                                referenceMonth
                        )
                );
    }

    private void requireDeletePermission(
            FinancialCreditCardPurchase purchase,
            FamilyMembership membership
    ) {
        boolean isCreator = Objects.equals(
                purchase.getCreatedBy().getId(),
                membership.getUser().getId()
        );

        boolean isAdministrator =
                membership.getRole() == FamilyRole.OWNER
                        || membership.getRole()
                        == FamilyRole.ADMIN;

        if (!isCreator && !isAdministrator) {
            throw new ForbiddenOperationException(
                    "Somente o criador ou um administrador pode excluir esta compra"
            );
        }
    }
}