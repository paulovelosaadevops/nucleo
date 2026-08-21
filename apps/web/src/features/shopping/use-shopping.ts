"use client";

import {
  archiveShoppingList,
  cancelShoppingItem,
  completeShoppingList,
  createShoppingItem,
  createShoppingList,
  deleteShoppingItem,
  deleteShoppingList,
  getShoppingList,
  listShoppingLists,
  markShoppingItemPending,
  purchaseShoppingItem,
  reopenShoppingList,
  restoreShoppingItem,
  updateShoppingItem,
  updateShoppingList,
} from "@/features/shopping/shopping-service";
import { getErrorMessage } from "@/lib/api/api-error";
import type {
  CreateShoppingItemRequest,
  CreateShoppingListRequest,
  MarkShoppingItemPurchasedRequest,
  ShoppingListDetails,
  ShoppingListStatus,
  ShoppingListSummary,
  UpdateShoppingItemRequest,
  UpdateShoppingListRequest,
} from "@/types/shopping";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

export function useShopping() {
  const [statusFilter, setStatusFilter] =
    useState<ShoppingListStatus | undefined>(
      "ACTIVE",
    );

  const [lists, setLists] =
    useState<ShoppingListSummary[]>([]);

  const [selectedList, setSelectedList] =
    useState<ShoppingListDetails | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loadingDetails, setLoadingDetails] =
    useState(false);

  const [performingAction, setPerformingAction] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await listShoppingLists(statusFilter);

      setLists(response);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openList = useCallback(
    async (listId: string) => {
      setLoadingDetails(true);
      setError(null);

      try {
        const response =
          await getShoppingList(listId);

        setSelectedList(response);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoadingDetails(false);
      }
    },
    [],
  );

  const closeList = useCallback(() => {
    setSelectedList(null);
  }, []);

  const refreshList = useCallback(
    async (listId: string) => {
      const response =
        await getShoppingList(listId);

      setSelectedList(response);
      await load();

      return response;
    },
    [load],
  );

  const runAction = useCallback(
    async <T,>(
      action: () => Promise<T>,
    ): Promise<T> => {
      setPerformingAction(true);
      setError(null);

      try {
        return await action();
      } catch (requestError) {
        setError(getErrorMessage(requestError));
        throw requestError;
      } finally {
        setPerformingAction(false);
      }
    },
    [],
  );

  const createList = useCallback(
    async (
      request: CreateShoppingListRequest,
    ) =>
      runAction(async () => {
        const response =
          await createShoppingList(request);

        await load();

        return response;
      }),
    [load, runAction],
  );

  const updateList = useCallback(
    async (
      listId: string,
      request: UpdateShoppingListRequest,
    ) =>
      runAction(async () => {
        const response =
          await updateShoppingList(
            listId,
            request,
          );

        setSelectedList(response);
        await load();

        return response;
      }),
    [load, runAction],
  );

  const completeList = useCallback(
    async (listId: string) =>
      runAction(async () => {
        const response =
          await completeShoppingList(listId);

        setSelectedList(response);
        await load();

        return response;
      }),
    [load, runAction],
  );

  const reopenList = useCallback(
    async (listId: string) =>
      runAction(async () => {
        const response =
          await reopenShoppingList(listId);

        setSelectedList(response);
        await load();

        return response;
      }),
    [load, runAction],
  );

  const archiveList = useCallback(
    async (listId: string) =>
      runAction(async () => {
        const response =
          await archiveShoppingList(listId);

        setSelectedList(null);
        await load();

        return response;
      }),
    [load, runAction],
  );

  const removeList = useCallback(
    async (listId: string) =>
      runAction(async () => {
        await deleteShoppingList(listId);

        setSelectedList(null);
        await load();
      }),
    [load, runAction],
  );

  const createItem = useCallback(
    async (
      listId: string,
      request: CreateShoppingItemRequest,
    ) =>
      runAction(async () => {
        await createShoppingItem(
          listId,
          request,
        );

        return refreshList(listId);
      }),
    [refreshList, runAction],
  );

  const updateItem = useCallback(
    async (
      listId: string,
      itemId: string,
      request: UpdateShoppingItemRequest,
    ) =>
      runAction(async () => {
        await updateShoppingItem(
          listId,
          itemId,
          request,
        );

        return refreshList(listId);
      }),
    [refreshList, runAction],
  );

  const purchaseItem = useCallback(
    async (
      listId: string,
      itemId: string,
      request?: MarkShoppingItemPurchasedRequest,
    ) =>
      runAction(async () => {
        await purchaseShoppingItem(
          listId,
          itemId,
          request,
        );

        return refreshList(listId);
      }),
    [refreshList, runAction],
  );

  const markItemPending = useCallback(
    async (
      listId: string,
      itemId: string,
    ) =>
      runAction(async () => {
        await markShoppingItemPending(
          listId,
          itemId,
        );

        return refreshList(listId);
      }),
    [refreshList, runAction],
  );

  const cancelItem = useCallback(
    async (
      listId: string,
      itemId: string,
    ) =>
      runAction(async () => {
        await cancelShoppingItem(
          listId,
          itemId,
        );

        return refreshList(listId);
      }),
    [refreshList, runAction],
  );

  const restoreItem = useCallback(
    async (
      listId: string,
      itemId: string,
    ) =>
      runAction(async () => {
        await restoreShoppingItem(
          listId,
          itemId,
        );

        return refreshList(listId);
      }),
    [refreshList, runAction],
  );

  const removeItem = useCallback(
    async (
      listId: string,
      itemId: string,
    ) =>
      runAction(async () => {
        await deleteShoppingItem(
          listId,
          itemId,
        );

        return refreshList(listId);
      }),
    [refreshList, runAction],
  );

  return {
    statusFilter,
    setStatusFilter,
    lists,
    selectedList,
    loading,
    loadingDetails,
    performingAction,
    error,
    refresh: load,
    openList,
    closeList,
    createList,
    updateList,
    completeList,
    reopenList,
    archiveList,
    removeList,
    createItem,
    updateItem,
    purchaseItem,
    markItemPending,
    cancelItem,
    restoreItem,
    removeItem,
  };
}