package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialAccount;
import br.com.nucleo.api.finance.domain.FinancialCreditCard;
import br.com.nucleo.api.finance.dto.CreateFinancialCreditCardRequest;
import br.com.nucleo.api.finance.dto.FinancialCreditCardResponse;
import br.com.nucleo.api.finance.dto.UpdateFinancialCreditCardRequest;
import br.com.nucleo.api.finance.repository.FinancialAccountRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInstallmentRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInvoiceRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardPurchaseRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialCreditCardService {

    private final FamilyAccessService familyAccessService;
    private final FinancialCreditCardRepository cardRepository;
    private final FinancialAccountRepository accountRepository;
    private final FinancialCreditCardInvoiceRepository invoiceRepository;
    private final FinancialCreditCardPurchaseRepository purchaseRepository;
    private final FinancialCreditCardInstallmentRepository installmentRepository;

    public FinancialCreditCardService(
            FamilyAccessService familyAccessService,
            FinancialCreditCardRepository cardRepository,
            FinancialAccountRepository accountRepository,
            FinancialCreditCardInvoiceRepository invoiceRepository,
            FinancialCreditCardPurchaseRepository purchaseRepository,
            FinancialCreditCardInstallmentRepository installmentRepository
    ) {
        this.familyAccessService = familyAccessService;
        this.cardRepository = cardRepository;
        this.accountRepository = accountRepository;
        this.invoiceRepository = invoiceRepository;
        this.purchaseRepository = purchaseRepository;
        this.installmentRepository = installmentRepository;
    }

    @Transactional
    public FinancialCreditCardResponse create(
            UUID currentUserId,
            CreateFinancialCreditCardRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        String name = normalizeName(request.name());

        ensureNameAvailable(
                membership.getFamily().getId(),
                name,
                null
        );

        FinancialAccount paymentAccount =
                findPaymentAccount(
                        request.paymentAccountId(),
                        membership.getFamily().getId()
                );

        FinancialCreditCard card =
                FinancialCreditCard.create(
                        membership.getFamily(),
                        name,
                        request.brand(),
                        request.lastFour(),
                        request.creditLimit(),
                        request.closingDay(),
                        request.dueDay(),
                        paymentAccount,
                        request.color(),
                        membership.getUser()
                );

        cardRepository.save(card);

        return toResponse(card);
    }

    @Transactional(readOnly = true)
    public List<FinancialCreditCardResponse> list(
            UUID currentUserId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        return cardRepository
                .findAllByFamily_IdOrderByActiveDescNameAsc(
                        membership.getFamily().getId()
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FinancialCreditCardResponse findById(
            UUID currentUserId,
            UUID cardId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialCreditCard card = requireCard(
                cardId,
                membership.getFamily().getId()
        );

        return toResponse(card);
    }

    @Transactional
    public FinancialCreditCardResponse update(
            UUID currentUserId,
            UUID cardId,
            UpdateFinancialCreditCardRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialCreditCard card = requireCard(
                cardId,
                membership.getFamily().getId()
        );

        String name = normalizeName(request.name());

        ensureNameAvailable(
                membership.getFamily().getId(),
                name,
                cardId
        );

        FinancialAccount paymentAccount =
                findPaymentAccount(
                        request.paymentAccountId(),
                        membership.getFamily().getId()
                );

        card.update(
                name,
                request.brand(),
                request.lastFour(),
                request.creditLimit(),
                request.closingDay(),
                request.dueDay(),
                paymentAccount,
                request.color()
        );

        return toResponse(card);
    }

    @Transactional
    public FinancialCreditCardResponse activate(
            UUID currentUserId,
            UUID cardId
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialCreditCard card = requireCard(
                cardId,
                membership.getFamily().getId()
        );

        card.activate();

        return toResponse(card);
    }

    @Transactional
    public FinancialCreditCardResponse deactivate(
            UUID currentUserId,
            UUID cardId
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialCreditCard card = requireCard(
                cardId,
                membership.getFamily().getId()
        );

        card.deactivate();

        return toResponse(card);
    }

    @Transactional
    public void delete(
            UUID currentUserId,
            UUID cardId
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialCreditCard card = requireCard(
                cardId,
                membership.getFamily().getId()
        );

        boolean hasInvoices =
                invoiceRepository.existsByCreditCard_Id(cardId);

        boolean hasPurchases =
                purchaseRepository.existsByCreditCard_Id(cardId);

        if (hasInvoices || hasPurchases) {
            throw new IllegalArgumentException(
                    "O cartão possui movimentações e não pode ser excluído. Desative-o."
            );
        }

        cardRepository.delete(card);
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

    private FinancialAccount findPaymentAccount(
            UUID accountId,
            UUID familyId
    ) {
        if (accountId == null) {
            return null;
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

    private void ensureNameAvailable(
            UUID familyId,
            String name,
            UUID currentCardId
    ) {
        boolean exists;

        if (currentCardId == null) {
            exists = cardRepository
                    .existsByFamily_IdAndNameIgnoreCase(
                            familyId,
                            name
                    );
        } else {
            exists = cardRepository
                    .existsByFamily_IdAndNameIgnoreCaseAndIdNot(
                            familyId,
                            name,
                            currentCardId
                    );
        }

        if (exists) {
            throw new IllegalArgumentException(
                    "Já existe um cartão com este nome"
            );
        }
    }

    private FinancialCreditCardResponse toResponse(
            FinancialCreditCard card
    ) {
        BigDecimal outstanding =
                installmentRepository
                        .calculateOutstandingAmount(
                                card.getId()
                        );

        return FinancialCreditCardResponse.from(
                card,
                outstanding
        );
    }

    private String normalizeName(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }
}