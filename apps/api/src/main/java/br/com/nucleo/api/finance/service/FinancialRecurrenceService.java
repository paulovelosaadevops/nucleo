package br.com.nucleo.api.finance.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nucleo.api.common.error.ForbiddenOperationException;
import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.domain.FamilyRole;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialAccount;
import br.com.nucleo.api.finance.domain.FinancialCategory;
import br.com.nucleo.api.finance.domain.FinancialCategoryType;
import br.com.nucleo.api.finance.domain.FinancialCreditCard;
import br.com.nucleo.api.finance.domain.FinancialPaymentMethod;
import br.com.nucleo.api.finance.domain.FinancialRecurrence;
import br.com.nucleo.api.finance.domain.FinancialRecurrenceOccurrence;
import br.com.nucleo.api.finance.domain.FinancialRecurrenceOccurrenceStatus;
import br.com.nucleo.api.finance.domain.FinancialTransaction;
import br.com.nucleo.api.finance.domain.FinancialTransactionType;
import br.com.nucleo.api.finance.dto.ConfirmFinancialRecurrenceOccurrenceRequest;
import br.com.nucleo.api.finance.dto.CreateFinancialRecurrenceRequest;
import br.com.nucleo.api.finance.dto.FinancialRecurrenceOccurrenceResponse;
import br.com.nucleo.api.finance.dto.FinancialRecurrenceResponse;
import br.com.nucleo.api.finance.dto.GenerateFinancialRecurrencesResponse;
import br.com.nucleo.api.finance.dto.PostponeFinancialRecurrenceOccurrenceRequest;
import br.com.nucleo.api.finance.dto.SkipFinancialRecurrenceOccurrenceRequest;
import br.com.nucleo.api.finance.dto.UpdateFinancialRecurrenceRequest;
import br.com.nucleo.api.finance.repository.FinancialAccountRepository;
import br.com.nucleo.api.finance.repository.FinancialCategoryRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardPurchaseRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardRepository;
import br.com.nucleo.api.finance.repository.FinancialRecurrenceOccurrenceRepository;
import br.com.nucleo.api.finance.repository.FinancialRecurrenceRepository;
import br.com.nucleo.api.finance.repository.FinancialTransactionRepository;
import br.com.nucleo.api.notification.domain.NotificationType;
import br.com.nucleo.api.notification.service.NotificationService;
import java.time.YearMonth;

@Service
public class FinancialRecurrenceService {

    private static final int MAXIMUM_GENERATED_PER_REQUEST = 1000;
    private static final long MAXIMUM_GENERATION_HORIZON = 366;

    private final FamilyAccessService familyAccessService;
    private final FinancialAccountRepository accountRepository;
    private final FinancialCategoryRepository categoryRepository;
    private final FinancialCreditCardRepository cardRepository;
    private final FinancialCreditCardPurchaseRepository purchaseRepository;
    private final FinancialRecurrenceRepository recurrenceRepository;
    private final FinancialRecurrenceOccurrenceRepository occurrenceRepository;
    private final FinancialTransactionRepository transactionRepository;
    private final FinancialCreditCardPurchaseService purchaseService;
    private final NotificationService notificationService;

    public FinancialRecurrenceService(
            FamilyAccessService familyAccessService,
            FinancialAccountRepository accountRepository,
            FinancialCategoryRepository categoryRepository,
            FinancialCreditCardRepository cardRepository,
            FinancialCreditCardPurchaseRepository purchaseRepository,
            FinancialRecurrenceRepository recurrenceRepository,
            FinancialRecurrenceOccurrenceRepository occurrenceRepository,
            FinancialTransactionRepository transactionRepository,
            FinancialCreditCardPurchaseService purchaseService,
            NotificationService notificationService
    ) {
        this.familyAccessService = familyAccessService;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.cardRepository = cardRepository;
        this.purchaseRepository = purchaseRepository;
        this.recurrenceRepository = recurrenceRepository;
        this.occurrenceRepository = occurrenceRepository;
        this.transactionRepository = transactionRepository;
        this.purchaseService = purchaseService;
        this.notificationService = notificationService;
    }

    @Transactional
    public FinancialRecurrenceResponse create(
            UUID currentUserId,
            CreateFinancialRecurrenceRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        validatePeriod(
                request.startDate(),
                request.endDate()
        );

        validateSourceSelection(
                request.accountId(),
                request.creditCardId(),
                request.type(),
                request.paymentMethod()
        );

        UUID familyId = membership.getFamily().getId();

        FinancialAccount account = request.accountId() == null
                ? null
                : requireActiveAccount(
                        request.accountId(),
                        familyId
                );

        FinancialCreditCard creditCard =
                request.creditCardId() == null
                        ? null
                        : requireActiveCard(
                                request.creditCardId(),
                                familyId
                        );

        FinancialCategory category = findActiveCategory(
                request.categoryId(),
                request.type(),
                familyId
        );

        int interval = request.interval() == null
                ? 1
                : request.interval();

        FinancialRecurrence recurrence =
                FinancialRecurrence.create(
                        membership.getFamily(),
                        account,
                        creditCard,
                        category,
                        request.type(),
                        request.description(),
                        request.amount(),
                        request.frequency(),
                        interval,
                        request.startDate(),
                        request.endDate(),
                        request.occurrenceCount(),
                        request.paymentMethod(),
                        request.notes(),
                        membership.getUser()
                );

        recurrenceRepository.saveAndFlush(recurrence);

        LocalDate today = LocalDate.now();

        if (recurrence.canGenerateOnOrBefore(today)) {
            generateRecurrences(
                    List.of(recurrence),
                    today
            );
        }

        return FinancialRecurrenceResponse.from(recurrence);
    }

    @Transactional(readOnly = true)
    public List<FinancialRecurrenceResponse> list(
            UUID currentUserId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        return recurrenceRepository
                .findAllByFamily_IdOrderByActiveDescCreatedAtDesc(
                        membership.getFamily().getId()
                )
                .stream()
                .map(FinancialRecurrenceResponse::from)
                .toList();
    }

    @Transactional
    public FinancialRecurrenceResponse update(
            UUID currentUserId,
            UUID recurrenceId,
            UpdateFinancialRecurrenceRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialRecurrence recurrence = requireRecurrence(
                recurrenceId,
                membership.getFamily().getId()
        );

        validateSourceSelection(
                request.accountId(),
                request.creditCardId(),
                request.type(),
                request.paymentMethod()
        );

        UUID familyId = membership.getFamily().getId();

        FinancialAccount account = request.accountId() == null
                ? null
                : requireActiveAccount(
                        request.accountId(),
                        familyId
                );

        FinancialCreditCard creditCard =
                request.creditCardId() == null
                        ? null
                        : requireActiveCard(
                                request.creditCardId(),
                                familyId
                        );

        FinancialCategory category = findActiveCategory(
                request.categoryId(),
                request.type(),
                familyId
        );

        recurrence.update(
                account,
                creditCard,
                category,
                request.type(),
                request.description(),
                request.amount(),
                request.paymentMethod(),
                request.notes()
        );

        return FinancialRecurrenceResponse.from(recurrence);
    }

    @Transactional
    public FinancialRecurrenceResponse pause(
            UUID currentUserId,
            UUID recurrenceId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialRecurrence recurrence = requireRecurrence(
                recurrenceId,
                membership.getFamily().getId()
        );

        recurrence.pause();

        return FinancialRecurrenceResponse.from(recurrence);
    }

    @Transactional
    public FinancialRecurrenceResponse resume(
            UUID currentUserId,
            UUID recurrenceId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialRecurrence recurrence = requireRecurrence(
                recurrenceId,
                membership.getFamily().getId()
        );

        if (
                recurrence.getAccount() != null
                        && !recurrence.getAccount().isActive()
        ) {
            throw new IllegalArgumentException(
                    "A conta da recorrência está inativa"
            );
        }

        if (
                recurrence.getCreditCard() != null
                        && !recurrence.getCreditCard().isActive()
        ) {
            throw new IllegalArgumentException(
                    "O cartão da recorrência está inativo"
            );
        }

        if (
                recurrence.getCategory() != null
                        && !recurrence.getCategory().isActive()
        ) {
            throw new IllegalArgumentException(
                    "A categoria da recorrência está inativa"
            );
        }

        recurrence.resume();

        return FinancialRecurrenceResponse.from(recurrence);
    }

    @Transactional
    public GenerateFinancialRecurrencesResponse generate(
            UUID currentUserId,
            LocalDate generateUntil
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        LocalDate limitDate = generateUntil == null
                ? LocalDate.now()
                : generateUntil;

        validateGenerationLimit(limitDate);

        List<FinancialRecurrence> recurrences =
                recurrenceRepository
                        .findAllByFamily_IdAndActiveTrueAndNextGenerationDateLessThanEqualOrderByNextGenerationDateAsc(
                                membership.getFamily().getId(),
                                limitDate
                        );

        return generateRecurrences(
                recurrences,
                limitDate
        );
    }

    @Transactional
    public GenerateFinancialRecurrencesResponse generateDueAutomatically(
            LocalDate limitDate
    ) {
        Objects.requireNonNull(
                limitDate,
                "Generation limit cannot be null"
        );

        List<FinancialRecurrence> recurrences =
                recurrenceRepository
                        .findAllByActiveTrueAndNextGenerationDateLessThanEqualOrderByNextGenerationDateAsc(
                                limitDate
                        );

        return generateRecurrences(
                recurrences,
                limitDate
        );
    }

    @Transactional(readOnly = true)
    public List<FinancialRecurrenceOccurrenceResponse> listOccurrences(
            UUID currentUserId,
            boolean pendingOnly
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(currentUserId);

        List<FinancialRecurrenceOccurrence> occurrences = pendingOnly
                ? occurrenceRepository.findAllByFamily_IdAndStatusInOrderByScheduledDateAsc(
                        membership.getFamily().getId(),
                        List.of(
                                FinancialRecurrenceOccurrenceStatus.AWAITING_CONFIRMATION,
                                FinancialRecurrenceOccurrenceStatus.OVERDUE
                        )
                )
                : occurrenceRepository.findAllByFamily_IdOrderByScheduledDateDescCreatedAtDesc(
                        membership.getFamily().getId()
                );

        return occurrences.stream()
                .map(FinancialRecurrenceOccurrenceResponse::from)
                .toList();
    }

    @Transactional
    public FinancialRecurrenceOccurrenceResponse confirmOccurrence(
            UUID currentUserId,
            UUID occurrenceId,
            ConfirmFinancialRecurrenceOccurrenceRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(currentUserId);

        FinancialRecurrenceOccurrence occurrence = requireOccurrence(
                occurrenceId,
                membership.getFamily().getId()
        );

        if (occurrence.isConfirmed()) {
            return FinancialRecurrenceOccurrenceResponse.from(occurrence);
        }

        FinancialRecurrence recurrence = occurrence.getRecurrence();
        UUID familyId = membership.getFamily().getId();
        FinancialCategory category = findActiveCategory(
                request.categoryId() == null
                        ? occurrence.getCategory() == null ? null : occurrence.getCategory().getId()
                        : request.categoryId(),
                recurrence.getType(),
                familyId
        );
        boolean creditCardRecurrence = isCreditCardRecurrence(recurrence);
        FinancialTransaction transaction = null;
        br.com.nucleo.api.finance.domain.FinancialCreditCardPurchase purchase = null;

        if (creditCardRecurrence) {
            FinancialCreditCard creditCard = request.creditCardId() == null
                    ? occurrence.getCreditCard()
                    : requireActiveCard(request.creditCardId(), familyId);
            int sequence = purchaseRepository.findMaximumRecurrenceSequence(recurrence.getId()) + 1;
            purchase = purchaseService.createFromRecurrence(
                    recurrence,
                    sequence,
                    request.chargedDate(),
                    request.amount(),
                    category,
                    creditCard,
                    request.notes()
            );
        } else {
            FinancialAccount account = request.accountId() == null
                    ? occurrence.getAccount()
                    : requireActiveAccount(request.accountId(), familyId);
            int sequence = transactionRepository.findMaximumRecurrenceSequence(recurrence.getId()) + 1;
            transaction = FinancialTransaction.createFromRecurrence(
                    recurrence,
                    sequence,
                    request.chargedDate(),
                    request.amount(),
                    category,
                    account,
                    request.paymentMethod() == null
                            ? recurrence.getPaymentMethod()
                            : request.paymentMethod(),
                    request.notes()
            );
            transactionRepository.save(transaction);
        }

        occurrence.confirm(
                request.amount(),
                request.chargedDate(),
                category,
                transaction == null ? occurrence.getAccount() : transaction.getAccount(),
                purchase == null ? occurrence.getCreditCard() : purchase.getCreditCard(),
                transaction,
                purchase,
                request.notes(),
                membership.getUser()
        );

        return FinancialRecurrenceOccurrenceResponse.from(occurrence);
    }

    @Transactional
    public FinancialRecurrenceOccurrenceResponse skipOccurrence(
            UUID currentUserId,
            UUID occurrenceId,
            SkipFinancialRecurrenceOccurrenceRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(currentUserId);
        FinancialRecurrenceOccurrence occurrence = requireOccurrence(
                occurrenceId,
                membership.getFamily().getId()
        );
        occurrence.skip(request.notes());
        return FinancialRecurrenceOccurrenceResponse.from(occurrence);
    }

    @Transactional
    public FinancialRecurrenceOccurrenceResponse postponeOccurrence(
            UUID currentUserId,
            UUID occurrenceId,
            PostponeFinancialRecurrenceOccurrenceRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(currentUserId);
        FinancialRecurrenceOccurrence occurrence = requireOccurrence(
                occurrenceId,
                membership.getFamily().getId()
        );
        occurrence.postpone(request.reminderDate());
        return FinancialRecurrenceOccurrenceResponse.from(occurrence);
    }

    private GenerateFinancialRecurrencesResponse generateRecurrences(
            List<FinancialRecurrence> recurrences,
            LocalDate limitDate
    ) {

        int createdTransactions = 0;
        int createdCreditCardPurchases = 0;
        int createdItems = 0;
        int processedRecurrences = 0;

        for (FinancialRecurrence recurrence : recurrences) {
            if (createdItems
                    >= MAXIMUM_GENERATED_PER_REQUEST) {
                break;
            }

            if (!isSourceActive(recurrence)) {
                recurrence.pause();
                continue;
            }

            if (
                    recurrence.getCategory() != null
                            && !recurrence.getCategory().isActive()
            ) {
                recurrence.pause();
                continue;
            }

            processedRecurrences++;

            while (
                    recurrence.canGenerateOnOrBefore(limitDate)
                            && createdItems
                            < MAXIMUM_GENERATED_PER_REQUEST
            ) {
                LocalDate generationDate =
                        recurrence.getNextGenerationDate();
                LocalDate referenceMonth =
                        YearMonth.from(generationDate).atDay(1);

                if (!occurrenceRepository.existsByRecurrence_IdAndReferenceMonth(
                        recurrence.getId(),
                        referenceMonth
                )) {
                    FinancialRecurrenceOccurrence occurrence =
                            occurrenceRepository.save(
                                    FinancialRecurrenceOccurrence.create(
                                            recurrence,
                                            generationDate
                                    )
                            );

                    notifyOccurrencePending(occurrence);
                    createdItems++;
                }

                recurrence.advanceAfterGeneration();
            }
        }

        return new GenerateFinancialRecurrencesResponse(
                limitDate,
                processedRecurrences,
                createdTransactions,
                createdCreditCardPurchases
        );
    }

    @Transactional
    public void delete(
            UUID currentUserId,
            UUID recurrenceId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FinancialRecurrence recurrence = requireRecurrence(
                recurrenceId,
                membership.getFamily().getId()
        );

        requireDeletePermission(recurrence, membership);

        if (
                transactionRepository
                        .existsByRecurrence_Id(recurrenceId)
                        || purchaseRepository
                        .existsByRecurrence_Id(recurrenceId)
        ) {
            throw new IllegalArgumentException(
                    "A recorrência já gerou lançamentos e não pode ser excluída. Pause-a."
            );
        }

        recurrenceRepository.delete(recurrence);
    }

    private FinancialRecurrence requireRecurrence(
            UUID recurrenceId,
            UUID familyId
    ) {
        return recurrenceRepository
                .findByIdAndFamily_Id(
                        recurrenceId,
                        familyId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Recorrência financeira não encontrada"
                        )
                );
    }

    private FinancialRecurrenceOccurrence requireOccurrence(
            UUID occurrenceId,
            UUID familyId
    ) {
        return occurrenceRepository
                .findByIdAndFamily_Id(occurrenceId, familyId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Pendencia de recorrencia nao encontrada"
                        )
                );
    }

    private void notifyOccurrencePending(
            FinancialRecurrenceOccurrence occurrence
    ) {
        notificationService.notifyActiveFamilyMembers(
                occurrence.getFamily(),
                null,
                NotificationType.FINANCIAL_RECURRENCE_CONFIRMATION,
                "Confirmar valor da recorrencia",
                "Informe o valor real de "
                        + occurrence.getRecurrence().getDescription()
                        + " deste mes.",
                "/financas?secao=recurrences",
                occurrence.getId(),
                "finance-recurrence-confirmation:"
                        + occurrence.getId()
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

    private FinancialCreditCard requireActiveCard(
            UUID creditCardId,
            UUID familyId
    ) {
        FinancialCreditCard creditCard = cardRepository
                .findByIdAndFamily_Id(
                        creditCardId,
                        familyId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Cartão de crédito não encontrado"
                        )
                );

        if (!creditCard.isActive()) {
            throw new IllegalArgumentException(
                    "O cartão selecionado está inativo"
            );
        }

        return creditCard;
    }

    private void validateSourceSelection(
            UUID accountId,
            UUID creditCardId,
            FinancialTransactionType type,
            FinancialPaymentMethod paymentMethod
    ) {
        boolean creditCardRecurrence =
                paymentMethod == FinancialPaymentMethod.CREDIT_CARD;

        if (creditCardRecurrence) {
            if (type != FinancialTransactionType.EXPENSE) {
                throw new IllegalArgumentException(
                        "Cartão de crédito só pode ser usado em recorrências de despesa"
                );
            }

            if (creditCardId == null) {
                throw new IllegalArgumentException(
                        "Informe o cartão de crédito"
                );
            }

            if (accountId != null) {
                throw new IllegalArgumentException(
                        "Recorrência de cartão não pode possuir conta financeira"
                );
            }

            return;
        }

        if (accountId == null) {
            throw new IllegalArgumentException(
                    "Informe a conta financeira"
            );
        }

        if (creditCardId != null) {
            throw new IllegalArgumentException(
                    "Selecione cartão de crédito como forma de pagamento"
            );
        }
    }

    private boolean isCreditCardRecurrence(
            FinancialRecurrence recurrence
    ) {
        return recurrence.getPaymentMethod()
                == FinancialPaymentMethod.CREDIT_CARD;
    }

    private boolean isSourceActive(
            FinancialRecurrence recurrence
    ) {
        if (isCreditCardRecurrence(recurrence)) {
            return recurrence.getCreditCard() != null
                    && recurrence.getCreditCard().isActive();
        }

        return recurrence.getAccount() != null
                && recurrence.getAccount().isActive();
    }

    private FinancialCategory findActiveCategory(
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

    private void validatePeriod(
            LocalDate startDate,
            LocalDate endDate
    ) {
        if (
                endDate != null
                        && endDate.isBefore(startDate)
        ) {
            throw new IllegalArgumentException(
                    "A data final não pode ser anterior à inicial"
            );
        }
    }

    private void validateGenerationLimit(
            LocalDate limitDate
    ) {
        LocalDate maximumDate = LocalDate.now()
                .plusDays(MAXIMUM_GENERATION_HORIZON);

        if (limitDate.isAfter(maximumDate)) {
            throw new IllegalArgumentException(
                    "A geração não pode ultrapassar 366 dias no futuro"
            );
        }
    }

    private void requireDeletePermission(
            FinancialRecurrence recurrence,
            FamilyMembership membership
    ) {
        boolean isCreator = Objects.equals(
                recurrence.getCreatedBy().getId(),
                membership.getUser().getId()
        );

        boolean isAdministrator =
                membership.getRole() == FamilyRole.OWNER
                        || membership.getRole() == FamilyRole.ADMIN;

        if (!isCreator && !isAdministrator) {
            throw new ForbiddenOperationException(
                    "Somente o criador ou um administrador pode excluir esta recorrência"
            );
        }
    }
}
