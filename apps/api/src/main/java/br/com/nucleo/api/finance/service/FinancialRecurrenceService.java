package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialAccount;
import br.com.nucleo.api.finance.domain.FinancialCategory;
import br.com.nucleo.api.finance.domain.FinancialCategoryType;
import br.com.nucleo.api.finance.domain.FinancialRecurrence;
import br.com.nucleo.api.finance.domain.FinancialTransaction;
import br.com.nucleo.api.finance.domain.FinancialTransactionType;
import br.com.nucleo.api.finance.dto.CreateFinancialRecurrenceRequest;
import br.com.nucleo.api.finance.dto.FinancialRecurrenceResponse;
import br.com.nucleo.api.finance.dto.GenerateFinancialRecurrencesResponse;
import br.com.nucleo.api.finance.dto.UpdateFinancialRecurrenceRequest;
import br.com.nucleo.api.finance.repository.FinancialAccountRepository;
import br.com.nucleo.api.finance.repository.FinancialCategoryRepository;
import br.com.nucleo.api.finance.repository.FinancialRecurrenceRepository;
import br.com.nucleo.api.finance.repository.FinancialTransactionRepository;

import br.com.nucleo.api.common.error.ForbiddenOperationException;
import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.domain.FamilyRole;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialRecurrenceService {

    private static final int MAXIMUM_GENERATED_PER_REQUEST = 1000;
    private static final long MAXIMUM_GENERATION_HORIZON = 366;

    private final FamilyAccessService familyAccessService;
    private final FinancialAccountRepository accountRepository;
    private final FinancialCategoryRepository categoryRepository;
    private final FinancialRecurrenceRepository recurrenceRepository;
    private final FinancialTransactionRepository transactionRepository;

    public FinancialRecurrenceService(
            FamilyAccessService familyAccessService,
            FinancialAccountRepository accountRepository,
            FinancialCategoryRepository categoryRepository,
            FinancialRecurrenceRepository recurrenceRepository,
            FinancialTransactionRepository transactionRepository
    ) {
        this.familyAccessService = familyAccessService;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.recurrenceRepository = recurrenceRepository;
        this.transactionRepository = transactionRepository;
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

        FinancialAccount account = requireActiveAccount(
                request.accountId(),
                membership.getFamily().getId()
        );

        FinancialCategory category = findActiveCategory(
                request.categoryId(),
                request.type(),
                membership.getFamily().getId()
        );

        int interval = request.interval() == null
                ? 1
                : request.interval();

        FinancialRecurrence recurrence =
                FinancialRecurrence.create(
                        membership.getFamily(),
                        account,
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

        recurrenceRepository.save(recurrence);

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

        FinancialAccount account = requireActiveAccount(
                request.accountId(),
                membership.getFamily().getId()
        );

        FinancialCategory category = findActiveCategory(
                request.categoryId(),
                request.type(),
                membership.getFamily().getId()
        );

        recurrence.update(
                account,
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

        if (!recurrence.getAccount().isActive()) {
            throw new IllegalArgumentException(
                    "A conta da recorrência está inativa"
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

        int createdTransactions = 0;
        int processedRecurrences = 0;

        for (FinancialRecurrence recurrence : recurrences) {
            if (createdTransactions
                    >= MAXIMUM_GENERATED_PER_REQUEST) {
                break;
            }

            if (!recurrence.getAccount().isActive()) {
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

            int sequence =
                    transactionRepository
                            .findMaximumRecurrenceSequence(
                                    recurrence.getId()
                            ) + 1;

            List<FinancialTransaction> generated =
                    new ArrayList<>();

            while (
                    recurrence.canGenerateOnOrBefore(limitDate)
                            && createdTransactions
                            < MAXIMUM_GENERATED_PER_REQUEST
            ) {
                FinancialTransaction transaction =
                        FinancialTransaction
                                .createFromRecurrence(
                                        recurrence,
                                        sequence,
                                        recurrence
                                                .getNextGenerationDate()
                                );

                generated.add(transaction);

                sequence++;
                createdTransactions++;
                recurrence.advanceAfterGeneration();
            }

            transactionRepository.saveAll(generated);
        }

        return new GenerateFinancialRecurrencesResponse(
                limitDate,
                processedRecurrences,
                createdTransactions
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