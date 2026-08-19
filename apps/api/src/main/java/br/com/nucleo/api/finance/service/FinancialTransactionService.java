package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.common.error.ForbiddenOperationException;
import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.domain.FamilyRole;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialAccount;
import br.com.nucleo.api.finance.domain.FinancialCategory;
import br.com.nucleo.api.finance.domain.FinancialCategoryType;
import br.com.nucleo.api.finance.domain.FinancialTransaction;
import br.com.nucleo.api.finance.domain.FinancialTransactionStatus;
import br.com.nucleo.api.finance.domain.FinancialTransactionType;
import br.com.nucleo.api.finance.dto.CreateFinancialTransactionRequest;
import br.com.nucleo.api.finance.dto.FinancialTransactionResponse;
import br.com.nucleo.api.finance.dto.UpdateFinancialTransactionRequest;
import br.com.nucleo.api.finance.repository.FinancialAccountRepository;
import br.com.nucleo.api.finance.repository.FinancialCategoryRepository;
import br.com.nucleo.api.finance.repository.FinancialTransactionRepository;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialTransactionService {

    private static final long MAXIMUM_PERIOD_IN_DAYS = 366;

    private final FamilyAccessService familyAccessService;
    private final FinancialAccountRepository accountRepository;
    private final FinancialCategoryRepository categoryRepository;
    private final FinancialTransactionRepository transactionRepository;

    public FinancialTransactionService(
            FamilyAccessService familyAccessService,
            FinancialAccountRepository accountRepository,
            FinancialCategoryRepository categoryRepository,
            FinancialTransactionRepository transactionRepository
    ) {
        this.familyAccessService = familyAccessService;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public FinancialTransactionResponse create(
            UUID currentUserId,
            CreateFinancialTransactionRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialAccount account = requireActiveAccount(
                request.accountId(),
                membership.getFamily().getId()
        );

        FinancialCategory category = findCategory(
                request.categoryId(),
                request.type(),
                membership.getFamily().getId()
        );

        validateDates(
                request.transactionDate(),
                request.dueDate()
        );

        FinancialTransactionStatus status =
                request.status() == null
                        ? FinancialTransactionStatus.PENDING
                        : request.status();

        if (status == FinancialTransactionStatus.CANCELLED) {
            throw new IllegalArgumentException(
                    "Um lançamento não pode ser criado como cancelado"
            );
        }

        FinancialTransaction transaction =
                FinancialTransaction.create(
                        membership.getFamily(),
                        account,
                        category,
                        request.type(),
                        request.description(),
                        request.amount(),
                        request.transactionDate(),
                        request.dueDate(),
                        status,
                        request.paymentMethod(),
                        membership.getUser(),
                        request.notes()
                );

        transactionRepository.save(transaction);

        return toResponse(transaction);
    }

    @Transactional(readOnly = true)
    public List<FinancialTransactionResponse> search(
            UUID currentUserId,
            LocalDate from,
            LocalDate to,
            FinancialTransactionType type,
            FinancialTransactionStatus status,
            UUID accountId,
            UUID categoryId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        validatePeriod(from, to);

        return transactionRepository.search(
                        membership.getFamily().getId(),
                        from,
                        to,
                        type,
                        status,
                        accountId,
                        categoryId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FinancialTransactionResponse findById(
            UUID currentUserId,
            UUID transactionId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        return toResponse(
                requireTransaction(
                        transactionId,
                        membership.getFamily().getId()
                )
        );
    }

    @Transactional
    public FinancialTransactionResponse update(
            UUID currentUserId,
            UUID transactionId,
            UpdateFinancialTransactionRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialTransaction transaction =
                requireTransaction(
                        transactionId,
                        membership.getFamily().getId()
                );

        ensureNotInvoicePayment(transaction);

        FinancialAccount account = requireActiveAccount(
                request.accountId(),
                membership.getFamily().getId()
        );

        FinancialCategory category = findCategory(
                request.categoryId(),
                request.type(),
                membership.getFamily().getId()
        );

        validateDates(
                request.transactionDate(),
                request.dueDate()
        );

        transaction.update(
                account,
                category,
                request.type(),
                request.description(),
                request.amount(),
                request.transactionDate(),
                request.dueDate(),
                request.paymentMethod(),
                request.notes()
        );

        return toResponse(transaction);
    }

    @Transactional
    public FinancialTransactionResponse markAsPaid(
            UUID currentUserId,
            UUID transactionId
    ) {
        FinancialTransaction transaction =
                requireAccessibleTransaction(
                        currentUserId,
                        transactionId
                );

        ensureNotInvoicePayment(transaction);

        transaction.markAsPaid();

        return toResponse(transaction);
    }

    @Transactional
    public FinancialTransactionResponse markAsPending(
            UUID currentUserId,
            UUID transactionId
    ) {
        FinancialTransaction transaction =
                requireAccessibleTransaction(
                        currentUserId,
                        transactionId
                );

        ensureNotInvoicePayment(transaction);

        transaction.markAsPending();

        return toResponse(transaction);
    }

    @Transactional
    public FinancialTransactionResponse cancel(
            UUID currentUserId,
            UUID transactionId
    ) {
        FinancialTransaction transaction =
                requireAccessibleTransaction(
                        currentUserId,
                        transactionId
                );

        ensureNotInvoicePayment(transaction);

        transaction.cancel();

        return toResponse(transaction);
    }

    @Transactional
    public FinancialTransactionResponse restore(
            UUID currentUserId,
            UUID transactionId
    ) {
        FinancialTransaction transaction =
                requireAccessibleTransaction(
                        currentUserId,
                        transactionId
                );

        ensureNotInvoicePayment(transaction);

        transaction.restore();

        return toResponse(transaction);
    }

    @Transactional
    public void delete(
            UUID currentUserId,
            UUID transactionId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialTransaction transaction =
                requireTransaction(
                        transactionId,
                        membership.getFamily().getId()
                );

        ensureNotInvoicePayment(transaction);

        boolean isCreator = Objects.equals(
                transaction.getCreatedBy().getId(),
                membership.getUser().getId()
        );

        boolean isAdministrator =
                membership.getRole() == FamilyRole.OWNER
                        || membership.getRole() == FamilyRole.ADMIN;

        if (!isCreator && !isAdministrator) {
            throw new ForbiddenOperationException(
                    "Somente o criador ou um administrador pode excluir este lançamento"
            );
        }

        transactionRepository.delete(transaction);
    }

    private FinancialTransaction requireAccessibleTransaction(
            UUID currentUserId,
            UUID transactionId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        return requireTransaction(
                transactionId,
                membership.getFamily().getId()
        );
    }

    private FinancialTransaction requireTransaction(
            UUID transactionId,
            UUID familyId
    ) {
        return transactionRepository
                .findByIdAndFamily_Id(
                        transactionId,
                        familyId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Lançamento financeiro não encontrado"
                        )
                );
    }

    private FinancialAccount requireActiveAccount(
            UUID accountId,
            UUID familyId
    ) {
        FinancialAccount account = accountRepository
                .findByIdAndFamily_Id(accountId, familyId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Conta financeira não encontrada"
                        )
                );

        if (!account.isActive()) {
            throw new IllegalArgumentException(
                    "A conta selecionada está inativa"
            );
        }

        return account;
    }

    private FinancialCategory findCategory(
            UUID categoryId,
            FinancialTransactionType transactionType,
            UUID familyId
    ) {
        if (categoryId == null) {
            return null;
        }

        FinancialCategory category = categoryRepository
                .findByIdAndFamily_Id(categoryId, familyId)
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

        FinancialCategoryType expectedType =
                FinancialCategoryType.valueOf(
                        transactionType.name()
                );

        if (category.getType() != expectedType) {
            throw new IllegalArgumentException(
                    "A categoria não corresponde ao tipo do lançamento"
            );
        }

        return category;
    }

    private void ensureNotInvoicePayment(
            FinancialTransaction transaction
    ) {
        if (transaction.isInvoicePayment()) {
            throw new IllegalArgumentException(
                    "O pagamento da fatura deve ser gerenciado pela própria fatura"
            );
        }
    }

    private void validateDates(
            LocalDate transactionDate,
            LocalDate dueDate
    ) {
        if (
                dueDate != null
                        && dueDate.isBefore(transactionDate)
        ) {
            throw new IllegalArgumentException(
                    "O vencimento não pode ser anterior à data do lançamento"
            );
        }
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

        if (
                ChronoUnit.DAYS.between(from, to)
                        > MAXIMUM_PERIOD_IN_DAYS
        ) {
            throw new IllegalArgumentException(
                    "O período consultado não pode ultrapassar 366 dias"
            );
        }
    }

    private FinancialTransactionResponse toResponse(
            FinancialTransaction transaction
    ) {
        return FinancialTransactionResponse.from(
                transaction,
                LocalDate.now()
        );
    }
}