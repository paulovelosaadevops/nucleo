package br.com.nucleo.api.shopping;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ShoppingListSummaryResponse(
        UUID id,
        String name,
        String description,
        ShoppingListStatus status,
        LocalDate dueDate,
        String createdByName,
        long totalItems,
        long pendingItems,
        long purchasedItems,
        long cancelledItems,
        BigDecimal estimatedTotal,
        BigDecimal actualTotal,
        Instant createdAt,
        Instant updatedAt
) {

    public static ShoppingListSummaryResponse from(
            ShoppingList shoppingList,
            List<ShoppingItem> items
    ) {
        long pendingItems = items.stream()
                .filter(ShoppingItem::isPending)
                .count();

        long purchasedItems = items.stream()
                .filter(ShoppingItem::isPurchased)
                .count();

        long cancelledItems = items.stream()
                .filter(ShoppingItem::isCancelled)
                .count();

        BigDecimal estimatedTotal = items.stream()
                .filter(item -> !item.isCancelled())
                .map(ShoppingItem::getEstimatedTotal)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal actualTotal = items.stream()
                .filter(ShoppingItem::isPurchased)
                .map(ShoppingItem::getActualTotal)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ShoppingListSummaryResponse(
                shoppingList.getId(),
                shoppingList.getName(),
                shoppingList.getDescription(),
                shoppingList.getStatus(),
                shoppingList.getDueDate(),
                shoppingList.getCreatedBy().getName(),
                items.size(),
                pendingItems,
                purchasedItems,
                cancelledItems,
                estimatedTotal,
                actualTotal,
                shoppingList.getCreatedAt(),
                shoppingList.getUpdatedAt()
        );
    }
}