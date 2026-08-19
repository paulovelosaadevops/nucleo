package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialCategory;
import br.com.nucleo.api.finance.domain.FinancialCategoryType;

import java.time.Instant;
import java.util.UUID;

public record FinancialCategoryResponse(
        UUID id,
        String name,
        FinancialCategoryType type,
        String color,
        String icon,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {

    public static FinancialCategoryResponse from(
            FinancialCategory category
    ) {
        return new FinancialCategoryResponse(
                category.getId(),
                category.getName(),
                category.getType(),
                category.getColor(),
                category.getIcon(),
                category.isActive(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}