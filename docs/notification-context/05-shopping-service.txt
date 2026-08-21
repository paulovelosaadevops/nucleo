package br.com.nucleo.api.shopping.service;

import br.com.nucleo.api.shopping.domain.ShoppingItem;
import br.com.nucleo.api.shopping.domain.ShoppingList;
import br.com.nucleo.api.shopping.domain.ShoppingListStatus;
import br.com.nucleo.api.shopping.dto.CreateShoppingItemRequest;
import br.com.nucleo.api.shopping.dto.CreateShoppingListRequest;
import br.com.nucleo.api.shopping.dto.MarkShoppingItemPurchasedRequest;
import br.com.nucleo.api.shopping.dto.ShoppingItemResponse;
import br.com.nucleo.api.shopping.dto.ShoppingListDetailsResponse;
import br.com.nucleo.api.shopping.dto.ShoppingListSummaryResponse;
import br.com.nucleo.api.shopping.dto.UpdateShoppingItemRequest;
import br.com.nucleo.api.shopping.dto.UpdateShoppingListRequest;
import br.com.nucleo.api.shopping.repository.ShoppingItemRepository;
import br.com.nucleo.api.shopping.repository.ShoppingListRepository;

import br.com.nucleo.api.family.repository.FamilyMembershipRepository;
import br.com.nucleo.api.family.service.FamilyAccessService;

import br.com.nucleo.api.common.error.ForbiddenOperationException;
import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.repository.FamilyMembershipRepository;
import br.com.nucleo.api.family.domain.FamilyRole;
import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShoppingService {

    private final FamilyAccessService familyAccessService;
    private final FamilyMembershipRepository membershipRepository;
    private final ShoppingListRepository listRepository;
    private final ShoppingItemRepository itemRepository;

    public ShoppingService(
            FamilyAccessService familyAccessService,
            FamilyMembershipRepository membershipRepository,
            ShoppingListRepository listRepository,
            ShoppingItemRepository itemRepository
    ) {
        this.familyAccessService = familyAccessService;
        this.membershipRepository = membershipRepository;
        this.listRepository = listRepository;
        this.itemRepository = itemRepository;
    }

    @Transactional
    public ShoppingListDetailsResponse createList(
            UUID currentUserId,
            CreateShoppingListRequest request
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        ShoppingList shoppingList = ShoppingList.create(
                currentMembership.getFamily(),
                request.name(),
                request.description(),
                request.dueDate(),
                currentMembership.getUser()
        );

        listRepository.save(shoppingList);

        return ShoppingListDetailsResponse.from(
                shoppingList,
                List.of()
        );
    }

    @Transactional(readOnly = true)
    public List<ShoppingListSummaryResponse> listLists(
            UUID currentUserId,
            ShoppingListStatus status
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        UUID familyId = currentMembership
                .getFamily()
                .getId();

        List<ShoppingList> lists;

        if (status == null) {
            lists = listRepository
                    .findAllByFamily_IdOrderByCreatedAtDesc(
                            familyId
                    );
        } else {
            lists = listRepository
                    .findAllByFamily_IdAndStatusOrderByCreatedAtDesc(
                            familyId,
                            status
                    );
        }

        return lists.stream()
                .map(list -> ShoppingListSummaryResponse.from(
                        list,
                        findItems(list.getId())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public ShoppingListDetailsResponse findListById(
            UUID currentUserId,
            UUID listId
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        ShoppingList shoppingList = requireList(
                listId,
                currentMembership
        );

        return ShoppingListDetailsResponse.from(
                shoppingList,
                findItems(shoppingList.getId())
        );
    }

    @Transactional
    public ShoppingListDetailsResponse updateList(
            UUID currentUserId,
            UUID listId,
            UpdateShoppingListRequest request
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        ShoppingList shoppingList = requireList(
                listId,
                currentMembership
        );

        shoppingList.update(
                request.name(),
                request.description(),
                request.dueDate()
        );

        return ShoppingListDetailsResponse.from(
                shoppingList,
                findItems(shoppingList.getId())
        );
    }

    @Transactional
    public ShoppingListDetailsResponse completeList(
            UUID currentUserId,
            UUID listId
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        ShoppingList shoppingList = requireList(
                listId,
                currentMembership
        );

        List<ShoppingItem> items = findItems(
                shoppingList.getId()
        );

        if (items.isEmpty()) {
            throw new IllegalArgumentException(
                    "Não é possível concluir uma lista vazia"
            );
        }

        boolean containsPendingItems = items.stream()
                .anyMatch(ShoppingItem::isPending);

        if (containsPendingItems) {
            throw new IllegalArgumentException(
                    "Existem itens pendentes na lista"
            );
        }

        shoppingList.complete();

        return ShoppingListDetailsResponse.from(
                shoppingList,
                items
        );
    }

    @Transactional
    public ShoppingListDetailsResponse reopenList(
            UUID currentUserId,
            UUID listId
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        ShoppingList shoppingList = requireList(
                listId,
                currentMembership
        );

        shoppingList.reopen();

        return ShoppingListDetailsResponse.from(
                shoppingList,
                findItems(shoppingList.getId())
        );
    }

    @Transactional
    public ShoppingListDetailsResponse archiveList(
            UUID currentUserId,
            UUID listId
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        ShoppingList shoppingList = requireList(
                listId,
                currentMembership
        );

        requireListManagementPermission(
                shoppingList,
                currentMembership
        );

        shoppingList.archive();

        return ShoppingListDetailsResponse.from(
                shoppingList,
                findItems(shoppingList.getId())
        );
    }

    @Transactional
    public void deleteList(
            UUID currentUserId,
            UUID listId
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        ShoppingList shoppingList = requireList(
                listId,
                currentMembership
        );

        requireListManagementPermission(
                shoppingList,
                currentMembership
        );

        listRepository.delete(shoppingList);
    }

    @Transactional
    public ShoppingItemResponse createItem(
            UUID currentUserId,
            UUID listId,
            CreateShoppingItemRequest request
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        ShoppingList shoppingList = requireList(
                listId,
                currentMembership
        );

        requireActiveList(shoppingList);

        FamilyMembership assignedTo = findAssignedMember(
                request.assignedToMembershipId(),
                currentMembership
        );

        int nextSortOrder =
                itemRepository.findMaximumSortOrder(
                        shoppingList.getId()
                ) + 1;

        ShoppingItem item = ShoppingItem.create(
                shoppingList,
                request.name(),
                request.description(),
                request.category(),
                request.quantity(),
                request.unit(),
                request.estimatedUnitPrice(),
                request.priority(),
                assignedTo,
                nextSortOrder
        );

        itemRepository.save(item);

        return ShoppingItemResponse.from(item);
    }

    @Transactional
    public ShoppingItemResponse updateItem(
            UUID currentUserId,
            UUID listId,
            UUID itemId,
            UpdateShoppingItemRequest request
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        ShoppingList shoppingList = requireList(
                listId,
                currentMembership
        );

        requireActiveList(shoppingList);

        ShoppingItem item = requireItem(
                itemId,
                listId,
                currentMembership
        );

        FamilyMembership assignedTo = findAssignedMember(
                request.assignedToMembershipId(),
                currentMembership
        );

        item.update(
                request.name(),
                request.description(),
                request.category(),
                request.quantity(),
                request.unit(),
                request.estimatedUnitPrice(),
                request.priority(),
                assignedTo
        );

        return ShoppingItemResponse.from(item);
    }

    @Transactional
    public ShoppingItemResponse markItemAsPurchased(
            UUID currentUserId,
            UUID listId,
            UUID itemId,
            MarkShoppingItemPurchasedRequest request
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        ShoppingList shoppingList = requireList(
                listId,
                currentMembership
        );

        requireActiveList(shoppingList);

        ShoppingItem item = requireItem(
                itemId,
                listId,
                currentMembership
        );

        BigDecimal actualUnitPrice = request == null
                ? null
                : request.actualUnitPrice();

        item.markAsPurchased(
                currentMembership,
                actualUnitPrice
        );

        return ShoppingItemResponse.from(item);
    }

    @Transactional
    public ShoppingItemResponse markItemAsPending(
            UUID currentUserId,
            UUID listId,
            UUID itemId
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        ShoppingList shoppingList = requireList(
                listId,
                currentMembership
        );

        requireActiveList(shoppingList);

        ShoppingItem item = requireItem(
                itemId,
                listId,
                currentMembership
        );

        item.markAsPending();

        return ShoppingItemResponse.from(item);
    }

    @Transactional
    public ShoppingItemResponse cancelItem(
            UUID currentUserId,
            UUID listId,
            UUID itemId
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        ShoppingList shoppingList = requireList(
                listId,
                currentMembership
        );

        requireActiveList(shoppingList);

        ShoppingItem item = requireItem(
                itemId,
                listId,
                currentMembership
        );

        item.cancel();

        return ShoppingItemResponse.from(item);
    }

    @Transactional
    public ShoppingItemResponse restoreItem(
            UUID currentUserId,
            UUID listId,
            UUID itemId
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        ShoppingList shoppingList = requireList(
                listId,
                currentMembership
        );

        requireActiveList(shoppingList);

        ShoppingItem item = requireItem(
                itemId,
                listId,
                currentMembership
        );

        if (!item.isCancelled()) {
            throw new IllegalArgumentException(
                    "Somente itens cancelados podem ser restaurados"
            );
        }

        item.restore();

        return ShoppingItemResponse.from(item);
    }

    @Transactional
    public void deleteItem(
            UUID currentUserId,
            UUID listId,
            UUID itemId
    ) {
        FamilyMembership currentMembership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        ShoppingList shoppingList = requireList(
                listId,
                currentMembership
        );

        requireActiveList(shoppingList);

        ShoppingItem item = requireItem(
                itemId,
                listId,
                currentMembership
        );

        itemRepository.delete(item);
    }

    private ShoppingList requireList(
            UUID listId,
            FamilyMembership currentMembership
    ) {
        return listRepository
                .findByIdAndFamily_Id(
                        listId,
                        currentMembership.getFamily().getId()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Lista de compras não encontrada"
                        )
                );
    }

    private ShoppingItem requireItem(
            UUID itemId,
            UUID expectedListId,
            FamilyMembership currentMembership
    ) {
        ShoppingItem item = itemRepository
                .findByIdAndShoppingList_Family_Id(
                        itemId,
                        currentMembership.getFamily().getId()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Item da lista não encontrado"
                        )
                );

        if (
                !Objects.equals(
                        item.getShoppingList().getId(),
                        expectedListId
                )
        ) {
            throw new ResourceNotFoundException(
                    "Item da lista não encontrado"
            );
        }

        return item;
    }

    private List<ShoppingItem> findItems(UUID listId) {
        return itemRepository
                .findAllByShoppingList_IdOrderBySortOrderAscCreatedAtAsc(
                        listId
                );
    }

    private FamilyMembership findAssignedMember(
            UUID membershipId,
            FamilyMembership currentMembership
    ) {
        if (membershipId == null) {
            return null;
        }

        FamilyMembership assignedMembership =
                membershipRepository
                        .findByIdAndFamily_Id(
                                membershipId,
                                currentMembership
                                        .getFamily()
                                        .getId()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Responsável não encontrado neste núcleo"
                                )
                        );

        if (!assignedMembership.isActive()) {
            throw new IllegalArgumentException(
                    "O responsável selecionado está inativo"
            );
        }

        return assignedMembership;
    }

    private void requireActiveList(
            ShoppingList shoppingList
    ) {
        if (!shoppingList.isActive()) {
            throw new IllegalArgumentException(
                    "Somente listas ativas podem ter seus itens alterados"
            );
        }
    }

    private void requireListManagementPermission(
            ShoppingList shoppingList,
            FamilyMembership currentMembership
    ) {
        boolean isCreator = Objects.equals(
                shoppingList.getCreatedBy().getId(),
                currentMembership.getUser().getId()
        );

        boolean isAdministrator =
                currentMembership.getRole() == FamilyRole.OWNER
                        || currentMembership.getRole()
                        == FamilyRole.ADMIN;

        if (!isCreator && !isAdministrator) {
            throw new ForbiddenOperationException(
                    "Somente o criador ou um administrador pode realizar esta operação"
            );
        }
    }
}