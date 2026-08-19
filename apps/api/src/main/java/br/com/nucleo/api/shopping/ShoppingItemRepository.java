package br.com.nucleo.api.shopping;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ShoppingItemRepository
        extends JpaRepository<ShoppingItem, UUID> {

    @EntityGraph(attributePaths = {
            "shoppingList",
            "assignedTo",
            "assignedTo.user",
            "checkedBy",
            "checkedBy.user"
    })
    List<ShoppingItem>
            findAllByShoppingList_IdOrderBySortOrderAscCreatedAtAsc(
                    UUID shoppingListId
            );

    @EntityGraph(attributePaths = {
            "shoppingList",
            "shoppingList.family",
            "assignedTo",
            "assignedTo.user",
            "checkedBy",
            "checkedBy.user"
    })
    Optional<ShoppingItem> findByIdAndShoppingList_Family_Id(
            UUID id,
            UUID familyId
    );

    long countByShoppingList_IdAndStatus(
            UUID shoppingListId,
            ShoppingItemStatus status
    );

    @Query("""
            select coalesce(max(item.sortOrder), -1)
            from ShoppingItem item
            where item.shoppingList.id = :shoppingListId
            """)
    int findMaximumSortOrder(
            @Param("shoppingListId") UUID shoppingListId
    );
}