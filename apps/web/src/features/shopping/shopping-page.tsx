"use client";

import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ShoppingListCard } from "@/features/shopping/shopping-list-card";
import { ShoppingListDetailsPanel } from "@/features/shopping/shopping-list-details";
import { ShoppingListForm } from "@/features/shopping/shopping-list-form";
import { useShopping } from "@/features/shopping/use-shopping";
import { cn } from "@/lib/cn";
import type { ShoppingListStatus } from "@/types/shopping";
import {
  Plus,
  RefreshCw,
  ShoppingBasket,
} from "lucide-react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

const filters: Array<{
  label: string;
  value: ShoppingListStatus | undefined;
}> = [
  { label: "Todas", value: undefined },
  { label: "Ativas", value: "ACTIVE" },
  { label: "Concluídas", value: "COMPLETED" },
  { label: "Arquivadas", value: "ARCHIVED" },
];

export function ShoppingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listFormOpen, setListFormOpen] =
    useState(false);

  const [editingList, setEditingList] =
    useState(false);

  const {
    statusFilter,
    setStatusFilter,
    lists,
    selectedList,
    loading,
    loadingDetails,
    performingAction,
    error,
    refresh,
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
  } = useShopping();

  useEffect(() => {
    if (searchParams.get("nova") === "true") {
      setListFormOpen(true);
    }

    const listId = searchParams.get("lista");

    if (listId) {
      void openList(listId);
    }
  }, [openList, searchParams]);

  function clearQuery() {
    router.replace("/compras", {
      scroll: false,
    });
  }

  function closeDetails() {
    closeList();
    clearQuery();
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow="Organização familiar"
        title="Compras"
        description="Listas compartilhadas e atualizadas em tempo real."
        action={
          <Button
            onClick={() =>
              setListFormOpen(true)
            }
          >
            <Plus className="h-4 w-4" />
            Nova lista
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() =>
                setStatusFilter(filter.value)
              }
              className={cn(
                "h-9 shrink-0 rounded-xl border px-3.5 text-xs font-medium transition",
                statusFilter === filter.value
                  ? "border-white bg-white text-black"
                  : "border-white/[0.08] bg-white/[0.025] text-zinc-500 hover:text-white",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-600 hover:bg-white/[0.06] hover:text-white"
          aria-label="Atualizar listas"
        >
          <RefreshCw
            className={cn(
              "h-4 w-4",
              loading && "animate-spin",
            )}
          />
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/15 bg-red-400/[0.055] px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-[1.35rem] border border-white/[0.06] bg-white/[0.03]"
              />
            ),
          )}
        </div>
      ) : lists.length === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          title="Nenhuma lista encontrada"
          description="Crie uma lista para organizar as próximas compras da família."
          actionLabel="Criar lista"
          actionIcon={
            <Plus className="h-4 w-4" />
          }
          onAction={() =>
            setListFormOpen(true)
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {lists.map((list) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              onClick={() => {
                router.replace(
                  `/compras?lista=${list.id}`,
                  {
                    scroll: false,
                  },
                );

                void openList(list.id);
              }}
            />
          ))}
        </div>
      )}

      <ShoppingListForm
        open={listFormOpen || editingList}
        loading={performingAction}
        initialList={
          editingList
            ? selectedList
            : null
        }
        onClose={() => {
          setListFormOpen(false);
          setEditingList(false);

          if (!selectedList) {
            clearQuery();
          }
        }}
        onSubmit={(request) =>
          editingList && selectedList
            ? updateList(
                selectedList.id,
                request,
              )
            : createList(request)
        }
      />

      <ShoppingListDetailsPanel
        list={selectedList}
        loading={loadingDetails}
        performingAction={performingAction}
        onClose={closeDetails}
        onEditList={() =>
          setEditingList(true)
        }
        onComplete={async () => {
          if (selectedList) {
            await completeList(
              selectedList.id,
            );
          }
        }}
        onReopen={async () => {
          if (selectedList) {
            await reopenList(
              selectedList.id,
            );
          }
        }}
        onArchive={async () => {
          if (selectedList) {
            await archiveList(
              selectedList.id,
            );
            clearQuery();
          }
        }}
        onDelete={async () => {
          if (selectedList) {
            await removeList(
              selectedList.id,
            );
            clearQuery();
          }
        }}
        onCreateItem={(request) =>
          createItem(
            selectedList!.id,
            request,
          )
        }
        onUpdateItem={(itemId, request) =>
          updateItem(
            selectedList!.id,
            itemId,
            request,
          )
        }
        onPurchaseItem={(
          itemId,
          actualUnitPrice,
        ) =>
          purchaseItem(
            selectedList!.id,
            itemId,
            { actualUnitPrice },
          )
        }
        onPendingItem={(itemId) =>
          markItemPending(
            selectedList!.id,
            itemId,
          )
        }
        onCancelItem={(itemId) =>
          cancelItem(
            selectedList!.id,
            itemId,
          )
        }
        onRestoreItem={(itemId) =>
          restoreItem(
            selectedList!.id,
            itemId,
          )
        }
        onDeleteItem={(itemId) =>
          removeItem(
            selectedList!.id,
            itemId,
          )
        }
      />
    </div>
  );
}