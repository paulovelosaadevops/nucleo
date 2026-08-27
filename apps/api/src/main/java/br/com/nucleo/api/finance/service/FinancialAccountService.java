package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.finance.domain.FinancialAccount;
import br.com.nucleo.api.finance.dto.ChangeInitialBalanceRequest;
import br.com.nucleo.api.finance.dto.CreateFinancialAccountRequest;
import br.com.nucleo.api.finance.dto.FinancialAccountResponse;
import br.com.nucleo.api.finance.dto.UpdateFinancialAccountRequest;
import br.com.nucleo.api.finance.repository.FinancialAccountRepository;
import br.com.nucleo.api.finance.repository.FinancialTransactionRepository;
import br.com.nucleo.api.finance.repository.FinancialTransferRepository;

import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.family.domain.FamilyMembership;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialAccountService {

    private final FamilyAccessService familyAccessService;
    private final FinancialAccountRepository accountRepository;
    private final FinancialTransactionRepository transactionRepository;
    private final FinancialTransferRepository transferRepository;

    public FinancialAccountService(
            FamilyAccessService familyAccessService,
            FinancialAccountRepository accountRepository,
            FinancialTransactionRepository transactionRepository,
            FinancialTransferRepository transferRepository
    ) {
        this.familyAccessService = familyAccessService;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.transferRepository = transferRepository;
    }

    @Transactional
    public FinancialAccountResponse create(
            UUID currentUserId,
            CreateFinancialAccountRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        String normalizedName = normalizeName(request.name());

        ensureNameAvailable(
                membership.getFamily().getId(),
                normalizedName,
                null
        );

        boolean includeInTotal =
                request.includeInTotal() == null
                        || request.includeInTotal();

        FinancialAccount account = FinancialAccount.create(
                membership.getFamily(),
                normalizedName,
                request.type(),
                request.initialBalance(),
                request.color(),
                includeInTotal,
                membership.getUser()
        );

        accountRepository.save(account);

        return toResponse(account);
    }

    @Transactional(readOnly = true)
    public List<FinancialAccountResponse> list(
            UUID currentUserId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        return accountRepository
                .findAllByFamily_IdOrderByActiveDescNameAsc(
                        membership.getFamily().getId()
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FinancialAccountResponse findById(
            UUID currentUserId,
            UUID accountId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialAccount account = requireAccount(
                accountId,
                membership.getFamily().getId()
        );

        return toResponse(account);
    }

    @Transactional
    public FinancialAccountResponse update(
            UUID currentUserId,
            UUID accountId,
            UpdateFinancialAccountRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialAccount account = requireAccount(
                accountId,
                membership.getFamily().getId()
        );

        String normalizedName = normalizeName(request.name());

        ensureNameAvailable(
                membership.getFamily().getId(),
                normalizedName,
                accountId
        );

        account.update(
                normalizedName,
                request.type(),
                request.color(),
                request.includeInTotal()
        );

        return toResponse(account);
    }

    @Transactional
    public FinancialAccountResponse changeInitialBalance(
            UUID currentUserId,
            UUID accountId,
            ChangeInitialBalanceRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialAccount account = requireAccount(
                accountId,
                membership.getFamily().getId()
        );

        account.changeInitialBalance(
                request.initialBalance()
        );

        return toResponse(account);
    }

    @Transactional
    public FinancialAccountResponse activate(
            UUID currentUserId,
            UUID accountId
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialAccount account = requireAccount(
                accountId,
                membership.getFamily().getId()
        );

        account.activate();

        return toResponse(account);
    }

    @Transactional
    public FinancialAccountResponse deactivate(
            UUID currentUserId,
            UUID accountId
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialAccount account = requireAccount(
                accountId,
                membership.getFamily().getId()
        );

        account.deactivate();

        return toResponse(account);
    }

    @Transactional
    public void delete(
            UUID currentUserId,
            UUID accountId
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialAccount account = requireAccount(
                accountId,
                membership.getFamily().getId()
        );

        if (transactionRepository.existsByAccount_Id(accountId)
                || transferRepository.existsBySourceAccount_IdOrDestinationAccount_Id(
                        accountId,
                        accountId
                )) {
            throw new IllegalArgumentException(
                    "A conta possui lançamentos e não pode ser excluída. Desative-a."
            );
        }

        accountRepository.delete(account);
    }

    private FinancialAccount requireAccount(
            UUID accountId,
            UUID familyId
    ) {
        return accountRepository
                .findByIdAndFamily_Id(accountId, familyId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Conta financeira não encontrada"
                        )
                );
    }

    private FinancialAccountResponse toResponse(
            FinancialAccount account
    ) {
        BigDecimal movements = zeroIfNull(accountRepository
                .calculatePaidMovementBalance(account.getId()));
        BigDecimal transfers = zeroIfNull(transferRepository
                .calculateCompletedTransferBalance(account.getId()));

        return FinancialAccountResponse.from(
                account,
                movements.add(transfers)
        );
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private void ensureNameAvailable(
            UUID familyId,
            String name,
            UUID currentAccountId
    ) {
        boolean alreadyExists;

        if (currentAccountId == null) {
            alreadyExists =
                    accountRepository
                            .existsByFamily_IdAndNameIgnoreCase(
                                    familyId,
                                    name
                            );
        } else {
            alreadyExists =
                    accountRepository
                            .existsByFamily_IdAndNameIgnoreCaseAndIdNot(
                                    familyId,
                                    name,
                                    currentAccountId
                            );
        }

        if (alreadyExists) {
            throw new IllegalArgumentException(
                    "Já existe uma conta com este nome"
            );
        }
    }

    private String normalizeName(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }
}
