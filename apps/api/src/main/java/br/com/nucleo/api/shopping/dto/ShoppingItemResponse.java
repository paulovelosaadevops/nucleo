package br.com.nucleo.api.shopping.dto;

import br.com.nucleo.api.shopping.domain.ShoppingItem;
import br.com.nucleo.api.shopping.domain.ShoppingItemCategory;
import br.com.nucleo.api.shopping.domain.ShoppingItemPriority;
import br.com.nucleo.api.shopping.domain.ShoppingItemStatus;
import br.com.nucleo.api.shopping.domain.ShoppingItemUnit;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ShoppingItemResponse(
        UUID id,
        String name,
        String description,
        ShoppingItemCategory category,
        BigDecimal quantity,
        ShoppingItemUnit unit,
        BigDecimal estimatedUnitPrice,
        BigDecimal estimatedTotal,
        BigDecimal actualUnitPrice,
        BigDecimal actualTotal,
        ShoppingItemPriority priority,
        ShoppingItemStatus status,
        UUID assignedToMembershipId,
        String assignedToName,
        UUID checkedByMembershipId,
        String checkedByName,
        Instant checkedAt,
        int sortOrder,
        Instant createdAt,
        Instant updatedAt
) {

    public static ShoppingItemResponse from(
            ShoppingItem item
    ) {
        UUID assignedToMembershipId = null;
        String assignedToName = null;

        if (item.getAssignedTo() != null) {
            assignedToMembershipId = item.getAssignedTo().getId();
            assignedToName = item.getAssignedTo()
                    .getUser()
                    .getName();
        }

        UUID checkedByMembershipId = null;
        String checkedByName = null;

        if (item.getCheckedBy() != null) {
            checkedByMembershipId = item.getCheckedBy().getId();
            checkedByName = item.getCheckedBy()
                    .getUser()
                    .getName();
        }

        return new ShoppingItemResponse(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getCategory(),
                item.getQuantity(),
                item.getUnit(),
                item.getEstimatedUnitPrice(),
                item.getEstimatedTotal(),
                item.getActualUnitPrice(),
                item.getActualTotal(),
                item.getPriority(),
                item.getStatus(),
                assignedToMembershipId,
                assignedToName,
                checkedByMembershipId,
                checkedByName,
                item.getCheckedAt(),
                item.getSortOrder(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}