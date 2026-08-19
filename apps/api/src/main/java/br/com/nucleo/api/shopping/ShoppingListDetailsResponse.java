package br.com.nucleo.api.shopping;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ShoppingListDetailsResponse(
        UUID id,
        String name,
        String description,
        ShoppingListStatus status,
        LocalDate dueDate,
        UUID createdByUserId,
        String createdByName,
        long totalItems,
        long pendingItems,
        long purchasedItems,
        long cancelledItems,
        BigDecimal estimatedTotal,
        BigDecimal actualTotal,
        List<ShoppingItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {

    public static ShoppingListDetailsResponse from(
            ShoppingList shoppingList,
            List<ShoppingItem> shoppingItems
    ) {
        List<ShoppingItemResponse> itemResponses = shoppingItems.stream()
                .map(ShoppingItemResponse::from)
                .toList();

        long pendingItems = shoppingItems.stream()
                .filter(ShoppingItem::isPending)
                .count();

        long purchasedItems = shoppingItems.stream()
                .filter(ShoppingItem::isPurchased)
                .count();

        long cancelledItems = shoppingItems.stream()
                .filter(ShoppingItem::isCancelled)
                .count();

        BigDecimal estimatedTotal = shoppingItems.stream()
                .filter(item -> !item.isCancelled())
                .map(ShoppingItem::getEstimatedTotal)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal actualTotal = shoppingItems.stream()
                .filter(ShoppingItem::isPurchased)
                .map(ShoppingItem::getActualTotal)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ShoppingListDetailsResponse(
                shoppingList.getId(),
                shoppingList.getName(),
                shoppingList.getDescription(),
                shoppingList.getStatus(),
                shoppingList.getDueDate(),
                shoppingList.getCreatedBy().getId(),
                shoppingList.getCreatedBy().getName(),
                shoppingItems.size(),
                pendingItems,
                purchasedItems,
                cancelledItems,
                estimatedTotal,
                actualTotal,
                itemResponses,
                shoppingList.getCreatedAt(),
                shoppingList.getUpdatedAt()
        );
    }
}