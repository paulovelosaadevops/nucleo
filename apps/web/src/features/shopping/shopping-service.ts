import { apiRequest } from "@/lib/api/api-client";
import type {
  CreateShoppingItemRequest,
  CreateShoppingListRequest,
  MarkShoppingItemPurchasedRequest,
  ShoppingItem,
  ShoppingListDetails,
  ShoppingListStatus,
  ShoppingListSummary,
  UpdateShoppingItemRequest,
  UpdateShoppingListRequest,
} from "@/types/shopping";

export async function listShoppingLists(
  status?: ShoppingListStatus,
) {
  const query = new URLSearchParams();

  if (status) {
    query.set("status", status);
  }

  const suffix = query.size > 0
    ? `?${query}`
    : "";

  return apiRequest<ShoppingListSummary[]>(
    `/api/shopping/lists${suffix}`,
  );
}

export async function getShoppingList(
  listId: string,
) {
  return apiRequest<ShoppingListDetails>(
    `/api/shopping/lists/${listId}`,
  );
}

export async function createShoppingList(
  request: CreateShoppingListRequest,
) {
  return apiRequest<ShoppingListDetails>(
    "/api/shopping/lists",
    {
      method: "POST",
      body: request,
    },
  );
}

export async function updateShoppingList(
  listId: string,
  request: UpdateShoppingListRequest,
) {
  return apiRequest<ShoppingListDetails>(
    `/api/shopping/lists/${listId}`,
    {
      method: "PUT",
      body: request,
    },
  );
}

export async function completeShoppingList(
  listId: string,
) {
  return apiRequest<ShoppingListDetails>(
    `/api/shopping/lists/${listId}/complete`,
    {
      method: "PATCH",
    },
  );
}

export async function reopenShoppingList(
  listId: string,
) {
  return apiRequest<ShoppingListDetails>(
    `/api/shopping/lists/${listId}/reopen`,
    {
      method: "PATCH",
    },
  );
}

export async function archiveShoppingList(
  listId: string,
) {
  return apiRequest<ShoppingListDetails>(
    `/api/shopping/lists/${listId}/archive`,
    {
      method: "PATCH",
    },
  );
}

export async function deleteShoppingList(
  listId: string,
) {
  return apiRequest<void>(
    `/api/shopping/lists/${listId}`,
    {
      method: "DELETE",
    },
  );
}

export async function createShoppingItem(
  listId: string,
  request: CreateShoppingItemRequest,
) {
  return apiRequest<ShoppingItem>(
    `/api/shopping/lists/${listId}/items`,
    {
      method: "POST",
      body: request,
    },
  );
}

export async function updateShoppingItem(
  listId: string,
  itemId: string,
  request: UpdateShoppingItemRequest,
) {
  return apiRequest<ShoppingItem>(
    `/api/shopping/lists/${listId}/items/${itemId}`,
    {
      method: "PUT",
      body: request,
    },
  );
}

export async function purchaseShoppingItem(
  listId: string,
  itemId: string,
  request?: MarkShoppingItemPurchasedRequest,
) {
  return apiRequest<ShoppingItem>(
    `/api/shopping/lists/${listId}/items/${itemId}/purchase`,
    {
      method: "PATCH",
      body: request,
    },
  );
}

export async function markShoppingItemPending(
  listId: string,
  itemId: string,
) {
  return apiRequest<ShoppingItem>(
    `/api/shopping/lists/${listId}/items/${itemId}/pending`,
    {
      method: "PATCH",
    },
  );
}

export async function cancelShoppingItem(
  listId: string,
  itemId: string,
) {
  return apiRequest<ShoppingItem>(
    `/api/shopping/lists/${listId}/items/${itemId}/cancel`,
    {
      method: "PATCH",
    },
  );
}

export async function restoreShoppingItem(
  listId: string,
  itemId: string,
) {
  return apiRequest<ShoppingItem>(
    `/api/shopping/lists/${listId}/items/${itemId}/restore`,
    {
      method: "PATCH",
    },
  );
}

export async function deleteShoppingItem(
  listId: string,
  itemId: string,
) {
  return apiRequest<void>(
    `/api/shopping/lists/${listId}/items/${itemId}`,
    {
      method: "DELETE",
    },
  );
}