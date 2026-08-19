package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialCategory;
import br.com.nucleo.api.finance.domain.FinancialCategoryType;
import br.com.nucleo.api.finance.dto.CreateFinancialCategoryRequest;
import br.com.nucleo.api.finance.dto.FinancialCategoryResponse;
import br.com.nucleo.api.finance.dto.UpdateFinancialCategoryRequest;
import br.com.nucleo.api.finance.repository.FinancialBudgetRepository;
import br.com.nucleo.api.finance.repository.FinancialCategoryRepository;
import br.com.nucleo.api.finance.repository.FinancialTransactionRepository;

import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.family.domain.FamilyMembership;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialCategoryService {

    private final FamilyAccessService familyAccessService;
    private final FinancialCategoryRepository categoryRepository;
    private final FinancialTransactionRepository transactionRepository;
    private final FinancialBudgetRepository budgetRepository;

    public FinancialCategoryService(
            FamilyAccessService familyAccessService,
            FinancialCategoryRepository categoryRepository,
            FinancialTransactionRepository transactionRepository,
            FinancialBudgetRepository budgetRepository
    ) {
        this.familyAccessService = familyAccessService;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
    }

    @Transactional
    public FinancialCategoryResponse create(
            UUID currentUserId,
            CreateFinancialCategoryRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        String normalizedName = normalizeName(request.name());

        ensureNameAvailable(
                membership.getFamily().getId(),
                request.type(),
                normalizedName,
                null
        );

        FinancialCategory category = FinancialCategory.create(
                membership.getFamily(),
                normalizedName,
                request.type(),
                request.color(),
                request.icon()
        );

        categoryRepository.save(category);

        return FinancialCategoryResponse.from(category);
    }

    @Transactional(readOnly = true)
    public List<FinancialCategoryResponse> list(
            UUID currentUserId,
            FinancialCategoryType type
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        List<FinancialCategory> categories;

        if (type == null) {
            categories = categoryRepository
                    .findAllByFamily_IdOrderByTypeAscNameAsc(
                            membership.getFamily().getId()
                    );
        } else {
            categories = categoryRepository
                    .findAllByFamily_IdAndTypeOrderByNameAsc(
                            membership.getFamily().getId(),
                            type
                    );
        }

        return categories.stream()
                .map(FinancialCategoryResponse::from)
                .toList();
    }

    @Transactional
    public FinancialCategoryResponse update(
            UUID currentUserId,
            UUID categoryId,
            UpdateFinancialCategoryRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialCategory category = requireCategory(
                categoryId,
                membership.getFamily().getId()
        );

        String normalizedName = normalizeName(request.name());

        ensureNameAvailable(
                membership.getFamily().getId(),
                category.getType(),
                normalizedName,
                categoryId
        );

        category.update(
                normalizedName,
                request.color(),
                request.icon()
        );

        return FinancialCategoryResponse.from(category);
    }

    @Transactional
    public FinancialCategoryResponse activate(
            UUID currentUserId,
            UUID categoryId
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialCategory category = requireCategory(
                categoryId,
                membership.getFamily().getId()
        );

        category.activate();

        return FinancialCategoryResponse.from(category);
    }

    @Transactional
    public FinancialCategoryResponse deactivate(
            UUID currentUserId,
            UUID categoryId
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialCategory category = requireCategory(
                categoryId,
                membership.getFamily().getId()
        );

        category.deactivate();

        return FinancialCategoryResponse.from(category);
    }

    @Transactional
    public void delete(
            UUID currentUserId,
            UUID categoryId
    ) {
        FamilyMembership membership =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        FinancialCategory category = requireCategory(
                categoryId,
                membership.getFamily().getId()
        );

        if (transactionRepository.existsByCategory_Id(categoryId)) {
            throw new IllegalArgumentException(
                    "A categoria possui lançamentos e não pode ser excluída. Desative-a."
            );
        }

        if (budgetRepository.existsByCategory_Id(categoryId)) {
            throw new IllegalArgumentException(
                    "A categoria possui orçamentos e não pode ser excluída. Remova os orçamentos primeiro."
            );
        }

        categoryRepository.delete(category);
    }

    private FinancialCategory requireCategory(
            UUID categoryId,
            UUID familyId
    ) {
        return categoryRepository
                .findByIdAndFamily_Id(categoryId, familyId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Categoria financeira não encontrada"
                        )
                );
    }

    private void ensureNameAvailable(
            UUID familyId,
            FinancialCategoryType type,
            String name,
            UUID currentCategoryId
    ) {
        boolean alreadyExists;

        if (currentCategoryId == null) {
            alreadyExists =
                    categoryRepository
                            .existsByFamily_IdAndTypeAndNameIgnoreCase(
                                    familyId,
                                    type,
                                    name
                            );
        } else {
            alreadyExists =
                    categoryRepository
                            .existsByFamily_IdAndTypeAndNameIgnoreCaseAndIdNot(
                                    familyId,
                                    type,
                                    name,
                                    currentCategoryId
                            );
        }

        if (alreadyExists) {
            throw new IllegalArgumentException(
                    "Já existe uma categoria deste tipo com este nome"
            );
        }
    }

    private String normalizeName(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }
}