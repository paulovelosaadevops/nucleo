package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialAccount;
import br.com.nucleo.api.finance.domain.FinancialTransaction;
import br.com.nucleo.api.finance.domain.FinancialTransactionType;
import br.com.nucleo.api.finance.domain.FinancialTransfer;
import br.com.nucleo.api.finance.domain.FinancialTransferType;
import br.com.nucleo.api.finance.dto.CreateFinancialTransferRequest;
import br.com.nucleo.api.finance.dto.FinancialTransferResponse;
import br.com.nucleo.api.finance.repository.FinancialAccountRepository;
import br.com.nucleo.api.finance.repository.FinancialTransactionRepository;
import br.com.nucleo.api.finance.repository.FinancialTransferRepository;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialTransferService {
    private final FamilyAccessService familyAccessService;
    private final FinancialAccountRepository accountRepository;
    private final FinancialTransferRepository transferRepository;
    private final FinancialTransactionRepository transactionRepository;

    public FinancialTransferService(
            FamilyAccessService familyAccessService,
            FinancialAccountRepository accountRepository,
            FinancialTransferRepository transferRepository,
            FinancialTransactionRepository transactionRepository
    ) {
        this.familyAccessService = familyAccessService;
        this.accountRepository = accountRepository;
        this.transferRepository = transferRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public FinancialTransferResponse create(
            UUID currentUserId,
            CreateFinancialTransferRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(currentUserId);
        UUID familyId = membership.getFamily().getId();
        FinancialAccount source = requireActiveAccount(request.sourceAccountId(), familyId);
        FinancialAccount destination = requireActiveAccount(request.destinationAccountId(), familyId);

        if (Objects.equals(source.getId(), destination.getId())) {
            throw new IllegalArgumentException("A origem e o destino devem ser diferentes");
        }

        FinancialTransfer transfer = FinancialTransfer.create(
                membership.getFamily(),
                source,
                destination,
                request.amount(),
                request.occurredAt(),
                FinancialTransferType.ACCOUNT_TRANSFER,
                request.description(),
                membership.getUser()
        );
        transferRepository.saveAndFlush(transfer);

        FinancialTransaction out = FinancialTransaction.createTransferLeg(
                transfer,
                source,
                FinancialTransactionType.TRANSFER_OUT,
                "Transferencia enviada para " + destination.getName(),
                request.amount(),
                request.occurredAt(),
                membership.getUser()
        );
        FinancialTransaction in = FinancialTransaction.createTransferLeg(
                transfer,
                destination,
                FinancialTransactionType.TRANSFER_IN,
                "Transferencia recebida de " + source.getName(),
                request.amount(),
                request.occurredAt(),
                membership.getUser()
        );
        transactionRepository.save(out);
        transactionRepository.save(in);

        return FinancialTransferResponse.from(transfer, out.getId(), in.getId());
    }

    private FinancialAccount requireActiveAccount(UUID accountId, UUID familyId) {
        FinancialAccount account = accountRepository
                .findByIdAndFamily_Id(accountId, familyId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta financeira nao encontrada"));
        if (!account.isActive()) {
            throw new IllegalArgumentException("A conta selecionada esta inativa");
        }
        return account;
    }
}
