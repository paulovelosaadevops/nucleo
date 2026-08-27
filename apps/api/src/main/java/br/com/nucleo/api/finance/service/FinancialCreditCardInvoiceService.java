package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialAccount;
import br.com.nucleo.api.finance.domain.FinancialCreditCard;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInstallment;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoice;
import br.com.nucleo.api.finance.domain.FinancialTransaction;
import br.com.nucleo.api.finance.dto.FinancialCreditCardInstallmentResponse;
import br.com.nucleo.api.finance.dto.FinancialCreditCardInvoiceResponse;
import br.com.nucleo.api.finance.dto.FinancialInvoiceCategorySummaryResponse;
import br.com.nucleo.api.finance.dto.PayFinancialCreditCardInvoiceRequest;
import br.com.nucleo.api.finance.repository.FinancialAccountRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInstallmentRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInvoicePaymentRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInvoiceRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialCreditCardInvoiceService {

    private final FamilyAccessService familyAccessService;
    private final FinancialCreditCardRepository cardRepository;
    private final FinancialCreditCardInvoiceRepository invoiceRepository;
    private final FinancialCreditCardInstallmentRepository
            installmentRepository;
    private final FinancialCreditCardInvoicePaymentRepository
            paymentRepository;
    private final FinancialAccountRepository accountRepository;

    public FinancialCreditCardInvoiceService(
            FamilyAccessService familyAccessService,
            FinancialCreditCardRepository cardRepository,
            FinancialCreditCardInvoiceRepository invoiceRepository,
            FinancialCreditCardInstallmentRepository
                    installmentRepository,
            FinancialCreditCardInvoicePaymentRepository
                    paymentRepository,
            FinancialAccountRepository accountRepository
    ) {
        this.familyAccessService = familyAccessService;
        this.cardRepository = cardRepository;
        this.invoiceRepository = invoiceRepository;
        this.installmentRepository = installmentRepository;
        this.paymentRepository = paymentRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional(readOnly = true)
    public List<FinancialCreditCardInvoiceResponse> list(
            UUID currentUserId,
            UUID cardId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        requireCard(
                cardId,
                membership.getFamily().getId()
        );

        return invoiceRepository
                .findAllByCreditCard_IdOrderByReferenceMonthDesc(
                        cardId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FinancialCreditCardInvoiceResponse findById(
            UUID currentUserId,
            UUID invoiceId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        return toResponse(
                requireInvoice(
                        invoiceId,
                        membership.getFamily().getId()
                )
        );
    }

    @Transactional(readOnly = true)
    public List<FinancialInvoiceCategorySummaryResponse> categorySummary(
            UUID currentUserId,
            UUID invoiceId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        requireInvoice(
                invoiceId,
                membership.getFamily().getId()
        );

        List<FinancialCreditCardInstallment> installments =
                installmentRepository
                        .findAllByInvoice_IdOrderByInstallmentNumberAsc(
                                invoiceId
                        );

        Map<UUID, CategoryBucket> buckets = new LinkedHashMap<>();
        CategoryBucket uncategorized = new CategoryBucket(
                null,
                "Sem categoria",
                null,
                true
        );

        for (FinancialCreditCardInstallment installment : installments) {
            if (installment.isCancelled()
                    || installment.getPurchase().isCancelled()) {
                continue;
            }

            BigDecimal signedAmount = installment.getSignedAmount();
            UUID categoryId = installment.getPurchase().getCategory() == null
                    ? null
                    : installment.getPurchase().getCategory().getId();
            CategoryBucket bucket = categoryId == null
                    ? uncategorized
                    : buckets.computeIfAbsent(
                            categoryId,
                            ignored -> new CategoryBucket(
                                    categoryId,
                                    installment.getPurchase().getCategory().getName(),
                                    installment.getPurchase().getCategory().getColor(),
                                    false
                            )
                    );
            bucket.add(signedAmount);
        }

        BigDecimal total = buckets.values().stream()
                .map(CategoryBucket::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(uncategorized.amount());

        List<FinancialInvoiceCategorySummaryResponse> categorized =
                buckets.values().stream()
                        .filter(CategoryBucket::hasItems)
                        .map(bucket -> bucket.toResponse(total))
                        .toList();

        if (!uncategorized.hasItems()) {
            return categorized;
        }

        return java.util.stream.Stream.concat(
                        categorized.stream(),
                        java.util.stream.Stream.of(
                                uncategorized.toResponse(total)
                        )
                )
                .toList();
    }

    @Transactional
    public FinancialCreditCardInvoiceResponse close(
            UUID currentUserId,
            UUID invoiceId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialCreditCardInvoice invoice =
                requireInvoice(
                        invoiceId,
                        membership.getFamily().getId()
                );

        if (!invoice.isOpen()) {
            throw new IllegalArgumentException(
                    "Somente uma fatura aberta pode ser fechada"
            );
        }

        BigDecimal total =
                installmentRepository.calculateInvoiceTotal(
                        invoiceId
                );

        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Uma fatura vazia não pode ser fechada"
            );
        }

        invoice.close();

        return toResponse(invoice);
    }

    @Transactional
    public FinancialCreditCardInvoiceResponse reopen(
            UUID currentUserId,
            UUID invoiceId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialCreditCardInvoice invoice =
                requireInvoice(
                        invoiceId,
                        membership.getFamily().getId()
                );

        if (!invoice.isClosed()) {
            throw new IllegalArgumentException(
                    "Somente uma fatura fechada pode ser reaberta"
            );
        }

        invoice.reopen();

        return toResponse(invoice);
    }

    @Transactional
    public FinancialCreditCardInvoiceResponse pay(
            UUID currentUserId,
            UUID invoiceId,
            PayFinancialCreditCardInvoiceRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialCreditCardInvoice invoice =
                requireInvoice(
                        invoiceId,
                        membership.getFamily().getId()
                );

        if (!invoice.isClosed()) {
            throw new IllegalArgumentException(
                    "Somente uma fatura fechada pode ser paga"
            );
        }

        if (
                paymentRepository
                        .existsByCreditCardInvoice_Id(invoiceId)
        ) {
            throw new IllegalArgumentException(
                    "Esta fatura já possui um pagamento"
            );
        }

        BigDecimal total =
                installmentRepository.calculateInvoiceTotal(
                        invoiceId
                );

        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Uma fatura vazia não pode ser paga"
            );
        }

        FinancialAccount paymentAccount =
                findPaymentAccount(
                        request.accountId(),
                        invoice,
                        membership.getFamily().getId()
                );

        FinancialTransaction payment =
                FinancialTransaction.createInvoicePayment(
                        invoice,
                        paymentAccount,
                        total,
                        request.paymentDate(),
                        request.paymentMethod(),
                        membership.getUser()
                );

        paymentRepository.save(payment);
        invoice.markAsPaid();

        return toResponse(invoice);
    }

    @Transactional
    public FinancialCreditCardInvoiceResponse reversePayment(
            UUID currentUserId,
            UUID invoiceId
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialCreditCardInvoice invoice =
                requireInvoice(
                        invoiceId,
                        membership.getFamily().getId()
                );

        if (!invoice.isPaid()) {
            throw new IllegalArgumentException(
                    "Somente uma fatura paga pode ter o pagamento estornado"
            );
        }

        FinancialTransaction payment =
                paymentRepository
                        .findByCreditCardInvoice_Id(invoiceId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Pagamento da fatura não encontrado"
                                )
                        );

        paymentRepository.delete(payment);
        invoice.reversePayment();

        return toResponse(invoice);
    }

    @Transactional
    public void deleteEmptyInvoice(
            UUID currentUserId,
            UUID invoiceId
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialCreditCardInvoice invoice =
                requireInvoice(
                        invoiceId,
                        membership.getFamily().getId()
                );

        if (
                installmentRepository.existsByInvoice_Id(
                        invoiceId
                )
        ) {
            throw new IllegalArgumentException(
                    "A fatura possui parcelas e não pode ser excluída"
            );
        }

        if (
                paymentRepository
                        .existsByCreditCardInvoice_Id(invoiceId)
        ) {
            throw new IllegalArgumentException(
                    "A fatura possui pagamento e não pode ser excluída"
            );
        }

        invoiceRepository.delete(invoice);
    }

    private FinancialCreditCard requireCard(
            UUID cardId,
            UUID familyId
    ) {
        return cardRepository
                .findByIdAndFamily_Id(cardId, familyId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Cartão de crédito não encontrado"
                        )
                );
    }

    private FinancialCreditCardInvoice requireInvoice(
            UUID invoiceId,
            UUID familyId
    ) {
        return invoiceRepository
                .findByIdAndCreditCard_Family_Id(
                        invoiceId,
                        familyId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Fatura não encontrada"
                        )
                );
    }

    private FinancialAccount findPaymentAccount(
            UUID requestedAccountId,
            FinancialCreditCardInvoice invoice,
            UUID familyId
    ) {
        UUID accountId = requestedAccountId;

        if (
                accountId == null
                        && invoice
                        .getCreditCard()
                        .getPaymentAccount() != null
        ) {
            accountId = invoice
                    .getCreditCard()
                    .getPaymentAccount()
                    .getId();
        }

        if (accountId == null) {
            throw new IllegalArgumentException(
                    "Informe a conta usada para pagar a fatura"
            );
        }

        FinancialAccount account = accountRepository
                .findByIdAndFamily_Id(accountId, familyId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Conta de pagamento não encontrada"
                        )
                );

        if (!account.isActive()) {
            throw new IllegalArgumentException(
                    "A conta de pagamento está inativa"
            );
        }

        return account;
    }

    private FinancialCreditCardInvoiceResponse toResponse(
            FinancialCreditCardInvoice invoice
    ) {
        List<FinancialCreditCardInstallment> installments =
                installmentRepository
                        .findAllByInvoice_IdOrderByInstallmentNumberAsc(
                                invoice.getId()
                        );

        List<FinancialCreditCardInstallmentResponse> responses =
                installments.stream()
                        .map(
                                FinancialCreditCardInstallmentResponse
                                        ::from
                        )
                        .toList();

        BigDecimal total =
                installmentRepository.calculateInvoiceTotal(
                        invoice.getId()
                );

        return FinancialCreditCardInvoiceResponse.from(
                invoice,
                total,
                responses
        );
    }

    private static final class CategoryBucket {
        private final UUID categoryId;
        private final String categoryName;
        private final String color;
        private final boolean uncategorized;
        private BigDecimal amount = BigDecimal.ZERO;
        private long itemCount;

        private CategoryBucket(
                UUID categoryId,
                String categoryName,
                String color,
                boolean uncategorized
        ) {
            this.categoryId = categoryId;
            this.categoryName = categoryName;
            this.color = color;
            this.uncategorized = uncategorized;
        }

        private void add(BigDecimal value) {
            amount = amount.add(value);
            itemCount++;
        }

        private boolean hasItems() {
            return itemCount > 0;
        }

        private BigDecimal amount() {
            return amount;
        }

        private FinancialInvoiceCategorySummaryResponse toResponse(
                BigDecimal total
        ) {
            BigDecimal percentage = BigDecimal.ZERO;

            if (total.compareTo(BigDecimal.ZERO) != 0) {
                percentage = amount
                        .multiply(BigDecimal.valueOf(100))
                        .divide(total, 2, RoundingMode.HALF_UP);
            }

            return new FinancialInvoiceCategorySummaryResponse(
                    categoryId,
                    categoryName,
                    color,
                    amount,
                    percentage,
                    itemCount,
                    uncategorized
            );
        }
    }
}
