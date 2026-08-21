export type ShoppingListStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "ARCHIVED";

export type ShoppingItemStatus =
  | "PENDING"
  | "PURCHASED"
  | "CANCELLED";

export type ShoppingItemCategory =
  | "FOOD"
  | "BEVERAGE"
  | "HYGIENE"
  | "CLEANING"
  | "PHARMACY"
  | "BABY"
  | "PET"
  | "HOUSEHOLD"
  | "CLOTHING"
  | "ELECTRONICS"
  | "OTHER";

export type ShoppingItemPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT";

export type ShoppingItemUnit =
  | "UNIT"
  | "PACKAGE"
  | "BOX"
  | "BOTTLE"
  | "CAN"
  | "LITER"
  | "MILLILITER"
  | "KILOGRAM"
  | "GRAM"
  | "METER"
  | "DOZEN";

export interface CreateShoppingListRequest {
  name: string;
  description?: string;
  dueDate?: string;
}

export type UpdateShoppingListRequest =
  CreateShoppingListRequest;

export interface ShoppingListSummary {
  id: string;
  name: string;
  description: string | null;
  status: ShoppingListStatus;
  dueDate: string | null;
  createdByName: string;
  totalItems: number;
  pendingItems: number;
  purchasedItems: number;
  cancelledItems: number;
  estimatedTotal: number;
  actualTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShoppingItemRequest {
  name: string;
  description?: string;
  category?: ShoppingItemCategory;
  quantity?: number;
  unit?: ShoppingItemUnit;
  estimatedUnitPrice?: number;
  priority?: ShoppingItemPriority;
  assignedToMembershipId?: string;
}

export type UpdateShoppingItemRequest =
  CreateShoppingItemRequest;

export interface MarkShoppingItemPurchasedRequest {
  actualUnitPrice?: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  description: string | null;
  category: ShoppingItemCategory | null;
  quantity: number | null;
  unit: ShoppingItemUnit | null;
  estimatedUnitPrice: number | null;
  estimatedTotal: number | null;
  actualUnitPrice: number | null;
  actualTotal: number | null;
  priority: ShoppingItemPriority | null;
  status: ShoppingItemStatus;
  assignedToMembershipId: string | null;
  assignedToName: string | null;
  checkedByMembershipId: string | null;
  checkedByName: string | null;
  checkedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListDetails {
  id: string;
  name: string;
  description: string | null;
  status: ShoppingListStatus;
  dueDate: string | null;
  createdByUserId: string;
  createdByName: string;
  totalItems: number;
  pendingItems: number;
  purchasedItems: number;
  cancelledItems: number;
  estimatedTotal: number;
  actualTotal: number;
  items: ShoppingItem[];
  createdAt: string;
  updatedAt: string;
}