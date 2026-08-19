package br.com.nucleo.api.shopping.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

import br.com.nucleo.api.family.domain.FamilyMembership;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "shopping_items")
public class ShoppingItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shopping_list_id", nullable = false)
    private ShoppingList shoppingList;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ShoppingItemCategory category;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ShoppingItemUnit unit;

    @Column(
            name = "estimated_unit_price",
            precision = 14,
            scale = 2
    )
    private BigDecimal estimatedUnitPrice;

    @Column(
            name = "actual_unit_price",
            precision = 14,
            scale = 2
    )
    private BigDecimal actualUnitPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ShoppingItemPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ShoppingItemStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_membership_id")
    private FamilyMembership assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_by_membership_id")
    private FamilyMembership checkedBy;

    @Column(name = "checked_at")
    private Instant checkedAt;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected ShoppingItem() {
    }

    private ShoppingItem(
            ShoppingList shoppingList,
            String name,
            String description,
            ShoppingItemCategory category,
            BigDecimal quantity,
            ShoppingItemUnit unit,
            BigDecimal estimatedUnitPrice,
            ShoppingItemPriority priority,
            FamilyMembership assignedTo,
            int sortOrder
    ) {
        this.shoppingList = Objects.requireNonNull(
                shoppingList,
                "Shopping list cannot be null"
        );
        this.name = normalizeName(name);
        this.description = normalizeOptionalText(description, 500);
        this.category = category == null
                ? ShoppingItemCategory.OTHER
                : category;
        this.quantity = validateQuantity(quantity);
        this.unit = unit == null
                ? ShoppingItemUnit.UNIT
                : unit;
        this.estimatedUnitPrice = validateOptionalPrice(
                estimatedUnitPrice
        );
        this.priority = priority == null
                ? ShoppingItemPriority.NORMAL
                : priority;
        this.assignedTo = assignedTo;
        this.sortOrder = validateSortOrder(sortOrder);
        this.status = ShoppingItemStatus.PENDING;
    }

    public static ShoppingItem create(
            ShoppingList shoppingList,
            String name,
            String description,
            ShoppingItemCategory category,
            BigDecimal quantity,
            ShoppingItemUnit unit,
            BigDecimal estimatedUnitPrice,
            ShoppingItemPriority priority,
            FamilyMembership assignedTo,
            int sortOrder
    ) {
        return new ShoppingItem(
                shoppingList,
                name,
                description,
                category,
                quantity,
                unit,
                estimatedUnitPrice,
                priority,
                assignedTo,
                sortOrder
        );
    }

    public void update(
            String name,
            String description,
            ShoppingItemCategory category,
            BigDecimal quantity,
            ShoppingItemUnit unit,
            BigDecimal estimatedUnitPrice,
            ShoppingItemPriority priority,
            FamilyMembership assignedTo
    ) {
        ensureListCanBeChanged();

        this.name = normalizeName(name);
        this.description = normalizeOptionalText(description, 500);
        this.category = category == null
                ? ShoppingItemCategory.OTHER
                : category;
        this.quantity = validateQuantity(quantity);
        this.unit = unit == null
                ? ShoppingItemUnit.UNIT
                : unit;
        this.estimatedUnitPrice = validateOptionalPrice(
                estimatedUnitPrice
        );
        this.priority = priority == null
                ? ShoppingItemPriority.NORMAL
                : priority;
        this.assignedTo = assignedTo;
    }

    public void markAsPurchased(
            FamilyMembership purchasedBy,
            BigDecimal actualUnitPrice
    ) {
        ensureListCanBeChanged();

        checkedBy = Objects.requireNonNull(
                purchasedBy,
                "Membership that purchased the item cannot be null"
        );
        this.actualUnitPrice = validateOptionalPrice(actualUnitPrice);
        checkedAt = Instant.now();
        status = ShoppingItemStatus.PURCHASED;
    }

    public void markAsPending() {
        ensureListCanBeChanged();

        status = ShoppingItemStatus.PENDING;
        actualUnitPrice = null;
        checkedBy = null;
        checkedAt = null;
    }

    public void cancel() {
        ensureListCanBeChanged();

        status = ShoppingItemStatus.CANCELLED;
        actualUnitPrice = null;
        checkedBy = null;
        checkedAt = null;
    }

    public void restore() {
        ensureListCanBeChanged();

        status = ShoppingItemStatus.PENDING;
        actualUnitPrice = null;
        checkedBy = null;
        checkedAt = null;
    }

    public void assignTo(FamilyMembership membership) {
        ensureListCanBeChanged();
        assignedTo = membership;
    }

    public void removeAssignment() {
        ensureListCanBeChanged();
        assignedTo = null;
    }

    public void changeSortOrder(int newSortOrder) {
        ensureListCanBeChanged();
        sortOrder = validateSortOrder(newSortOrder);
    }

    public BigDecimal getEstimatedTotal() {
        if (estimatedUnitPrice == null) {
            return null;
        }

        return estimatedUnitPrice.multiply(quantity);
    }

    public BigDecimal getActualTotal() {
        if (actualUnitPrice == null) {
            return null;
        }

        return actualUnitPrice.multiply(quantity);
    }

    public boolean isPending() {
        return status == ShoppingItemStatus.PENDING;
    }

    public boolean isPurchased() {
        return status == ShoppingItemStatus.PURCHASED;
    }

    public boolean isCancelled() {
        return status == ShoppingItemStatus.CANCELLED;
    }

    private void ensureListCanBeChanged() {
        if (shoppingList.isArchived()) {
            throw new IllegalStateException(
                    "Items from an archived shopping list cannot be changed"
            );
        }
    }

    @PrePersist
    private void onCreate() {
        Instant now = Instant.now();

        createdAt = now;
        updatedAt = now;

        if (category == null) {
            category = ShoppingItemCategory.OTHER;
        }

        if (quantity == null) {
            quantity = BigDecimal.ONE;
        }

        if (unit == null) {
            unit = ShoppingItemUnit.UNIT;
        }

        if (priority == null) {
            priority = ShoppingItemPriority.NORMAL;
        }

        if (status == null) {
            status = ShoppingItemStatus.PENDING;
        }
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    private static String normalizeName(String value) {
        String normalized = Objects.requireNonNull(
                value,
                "Shopping item name cannot be null"
        ).trim().replaceAll("\\s+", " ");

        if (normalized.isEmpty() || normalized.length() > 160) {
            throw new IllegalArgumentException(
                    "Shopping item name must contain between 1 and 160 characters"
            );
        }

        return normalized;
    }

    private static String normalizeOptionalText(
            String value,
            int maximumLength
    ) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim().replaceAll("\\s+", " ");

        if (normalized.length() > maximumLength) {
            throw new IllegalArgumentException(
                    "Text cannot contain more than "
                            + maximumLength
                            + " characters"
            );
        }

        return normalized;
    }

    private static BigDecimal validateQuantity(BigDecimal value) {
        BigDecimal quantityValue = Objects.requireNonNullElse(
                value,
                BigDecimal.ONE
        );

        if (quantityValue.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Item quantity must be greater than zero"
            );
        }

        if (normalizedScale(quantityValue) > 3) {
            throw new IllegalArgumentException(
                    "Item quantity can contain at most 3 decimal places"
            );
        }

        if (quantityValue.precision() > 12) {
            throw new IllegalArgumentException(
                    "Item quantity is too large"
            );
        }

        return quantityValue;
    }

    private static BigDecimal validateOptionalPrice(BigDecimal value) {
        if (value == null) {
            return null;
        }

        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Item price cannot be negative"
            );
        }

        if (normalizedScale(value) > 2) {
            throw new IllegalArgumentException(
                    "Item price can contain at most 2 decimal places"
            );
        }

        if (value.precision() > 14) {
            throw new IllegalArgumentException(
                    "Item price is too large"
            );
        }

        return value;
    }

    private static int normalizedScale(BigDecimal value) {
        return Math.max(value.stripTrailingZeros().scale(), 0);
    }

    private static int validateSortOrder(int value) {
        if (value < 0) {
            throw new IllegalArgumentException(
                    "Item sort order cannot be negative"
            );
        }

        return value;
    }

    public UUID getId() {
        return id;
    }

    public ShoppingList getShoppingList() {
        return shoppingList;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public ShoppingItemCategory getCategory() {
        return category;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public ShoppingItemUnit getUnit() {
        return unit;
    }

    public BigDecimal getEstimatedUnitPrice() {
        return estimatedUnitPrice;
    }

    public BigDecimal getActualUnitPrice() {
        return actualUnitPrice;
    }

    public ShoppingItemPriority getPriority() {
        return priority;
    }

    public ShoppingItemStatus getStatus() {
        return status;
    }

    public FamilyMembership getAssignedTo() {
        return assignedTo;
    }

    public FamilyMembership getCheckedBy() {
        return checkedBy;
    }

    public Instant getCheckedAt() {
        return checkedAt;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public long getVersion() {
        return version;
    }
}