"use client";

import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import { ShoppingItemForm } from "@/features/shopping/shopping-item-form";
import { ShoppingItemRow } from "@/features/shopping/shopping-item-row";
import { ShoppingListActions } from "@/features/shopping/shopping-list-actions";
import type {
  CreateShoppingItemRequest,
  ShoppingItem,
  ShoppingListDetails,
} from "@/types/shopping";
import {
  CalendarDays,
  Plus,
  ShoppingBasket,
} from "lucide-react";
import { useState } from "react";

interface ShoppingListDetailsProps {
  list: ShoppingListDetails | null;
  loading: boolean;
  performingAction: boolean;
  onClose: () => void;
  onEditList: () => void;
  onComplete: () => Promise<void>;
  onReopen: () => Promise<void>;
  onArchive: () => Promise<void>;
  onDelete: () => Promise<void>;
  onCreateItem: (
    request: CreateShoppingItemRequest,
  ) => Promise<unknown>;
  onUpdateItem: (
    itemId: string,
    request: CreateShoppingItemRequest,
  ) => Promise<unknown>;
  onPurchaseItem: (
    itemId: string,
    actualUnitPrice?: number,
  ) => Promise<unknown>;
  onPendingItem: (
    itemId: string,
  ) => Promise<unknown>;
  onCancelItem: (
    itemId: string,
  ) => Promise<unknown>;
  onRestoreItem: (
    itemId: string,
  ) => Promise<unknown>;
  onDeleteItem: (
    itemId: string,
  ) => Promise<unknown>;
}

const currencyFormatter =
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

function parseLocalDate(
  value: string,
): Date {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  );
}

export function ShoppingListDetailsPanel({
  list,
  loading,
  performingAction,
  onClose,
  onEditList,
  onComplete,
  onReopen,
  onArchive,
  onDelete,
  onCreateItem,
  onUpdateItem,
  onPurchaseItem,
  onPendingItem,
  onCancelItem,
  onRestoreItem,
  onDeleteItem,
}: ShoppingListDetailsProps) {
  const [
    itemFormOpen,
    setItemFormOpen,
  ] = useState(false);

  const [
    editingItem,
    setEditingItem,
  ] = useState<ShoppingItem | null>(
    null,
  );

  if (!loading && !list) {
    return null;
  }

  const orderedItems = list
    ? [...list.items].sort(
        (left, right) => {
          const statusOrder = {
            PENDING: 0,
            PURCHASED: 1,
            CANCELLED: 2,
          };

          return (
            statusOrder[left.status] -
              statusOrder[right.status] ||
            left.sortOrder -
              right.sortOrder
          );
        },
      )
    : [];

  function openNewItemForm() {
    setEditingItem(null);
    setItemFormOpen(true);
  }

  function openEditItemForm(
    item: ShoppingItem,
  ) {
    setEditingItem(item);
    setItemFormOpen(true);
  }

  function closeItemForm() {
    setItemFormOpen(false);
    setEditingItem(null);
  }

  return (
    <ModalShell
      eyebrow="Lista de compras"
      title={
        list?.name ??
        "Carregando lista"
      }
      titleId="shopping-list-details-title"
      busy={performingAction}
      size="large"
      onClose={onClose}
    >
      <div
        className="
          flex
          min-h-0
          flex-1
          flex-col
        "
      >
        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            p-5
            sm:p-7
          "
        >
          {loading || !list ? (
            <ShoppingListSkeleton />
          ) : (
            <div className="animate-fade-up">
              <div
                className="
                  flex
                  flex-col
                  gap-4
                  lg:flex-row
                  lg:items-start
                  lg:justify-between
                "
              >
                <div className="min-w-0">
                  {list.description && (
                    <p
                      className="
                        max-w-2xl
                        text-sm
                        leading-6
                        text-zinc-500
                      "
                    >
                      {list.description}
                    </p>
                  )}

                  {list.dueDate && (
                    <p
                      className="
                        mt-2
                        flex
                        items-center
                        gap-2
                        text-xs
                        text-zinc-600
                      "
                    >
                      <CalendarDays className="size-3.5" />

                      Até{" "}
                      {parseLocalDate(
                        list.dueDate,
                      ).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                  )}
                </div>

                {list.status ===
                  "ACTIVE" && (
                  <Button
                    className="shrink-0"
                    disabled={
                      performingAction
                    }
                    onClick={
                      openNewItemForm
                    }
                  >
                    <Plus className="size-4" />
                    Adicionar item
                  </Button>
                )}
              </div>

              <div
                className="
                  my-6
                  grid
                  grid-cols-2
                  gap-3
                  lg:grid-cols-4
                "
              >
                <Summary
                  label="Itens"
                  value={String(
                    list.totalItems,
                  )}
                />

                <Summary
                  label="Pendentes"
                  value={String(
                    list.pendingItems,
                  )}
                />

                <Summary
                  label="Estimado"
                  value={
                    currencyFormatter.format(
                      list.estimatedTotal,
                    )
                  }
                />

                <Summary
                  label="Real"
                  value={
                    currencyFormatter.format(
                      list.actualTotal,
                    )
                  }
                />
              </div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Itens da lista
                  </h3>

                  <p className="mt-1 text-xs text-zinc-600">
                    Acompanhe o que ainda
                    falta comprar.
                  </p>
                </div>

                <span
                  className="
                    rounded-full
                    border
                    border-white/[0.07]
                    bg-white/[0.03]
                    px-2.5
                    py-1
                    text-[0.65rem]
                    text-zinc-500
                  "
                >
                  {list.pendingItems}{" "}
                  {list.pendingItems === 1
                    ? "pendente"
                    : "pendentes"}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {orderedItems.length ===
                0 ? (
                  <div
                    className="
                      flex
                      min-h-48
                      flex-col
                      items-center
                      justify-center
                      rounded-[1.25rem]
                      border
                      border-dashed
                      border-white/[0.08]
                      bg-white/[0.015]
                      px-5
                      text-center
                    "
                  >
                    <div
                      className="
                        flex
                        size-12
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-white/[0.08]
                        bg-white/[0.035]
                      "
                    >
                      <ShoppingBasket className="size-5 text-zinc-600" />
                    </div>

                    <p className="mt-4 text-sm font-medium text-zinc-400">
                      Esta lista ainda está
                      vazia
                    </p>

                    <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-600">
                      Adicione os itens que
                      sua família precisa
                      comprar.
                    </p>

                    {list.status ===
                      "ACTIVE" && (
                      <Button
                        variant="secondary"
                        className="mt-5"
                        disabled={
                          performingAction
                        }
                        onClick={
                          openNewItemForm
                        }
                      >
                        <Plus className="size-4" />
                        Adicionar primeiro item
                      </Button>
                    )}
                  </div>
                ) : (
                  orderedItems.map(
                    (item) => (
                      <ShoppingItemRow
                        key={item.id}
                        item={item}
                        disabled={
                          performingAction
                        }
                        onEdit={() =>
                          openEditItemForm(
                            item,
                          )
                        }
                        onPurchase={(
                          price,
                        ) =>
                          onPurchaseItem(
                            item.id,
                            price,
                          )
                        }
                        onPending={() =>
                          onPendingItem(
                            item.id,
                          )
                        }
                        onCancel={() =>
                          onCancelItem(
                            item.id,
                          )
                        }
                        onRestore={() =>
                          onRestoreItem(
                            item.id,
                          )
                        }
                        onDelete={() =>
                          onDeleteItem(
                            item.id,
                          )
                        }
                      />
                    ),
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {list && !loading && (
          <footer
            className="
              shrink-0
              border-t
              border-white/10
              bg-[#090909]/95
              px-5
              py-4
              backdrop-blur-xl
              sm:px-7
            "
          >
            <ShoppingListActions
              list={list}
              loading={
                performingAction
              }
              onEdit={onEditList}
              onComplete={onComplete}
              onReopen={onReopen}
              onArchive={onArchive}
              onDelete={onDelete}
            />

            <p
              className="
                mt-3
                text-center
                text-[0.65rem]
                text-zinc-700
              "
            >
              Criada por{" "}
              {list.createdByName}
            </p>
          </footer>
        )}
      </div>

      {list && (
        <ShoppingItemForm
          open={itemFormOpen}
          loading={performingAction}
          initialItem={editingItem}
          onClose={closeItemForm}
          onSubmit={(request) =>
            editingItem
              ? onUpdateItem(
                  editingItem.id,
                  request,
                )
              : onCreateItem(request)
          }
        />
      )}
    </ModalShell>
  );
}

function ShoppingListSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-1/2 rounded bg-white/[0.055]" />

      <div className="mt-3 h-3 w-32 rounded bg-white/[0.035]" />

      <div className="my-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="h-20 rounded-2xl bg-white/[0.035]"
          />
        ))}
      </div>

      <div className="h-4 w-36 rounded bg-white/[0.055]" />

      <div className="mt-4 space-y-2">
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <div
            key={index}
            className="h-20 rounded-2xl bg-white/[0.035]"
          />
        ))}
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        min-w-0
        rounded-2xl
        border
        border-white/[0.07]
        bg-white/[0.025]
        p-3.5
      "
    >
      <p className="text-[0.65rem] text-zinc-600">
        {label}
      </p>

      <p
        className="
          mt-1
          truncate
          text-sm
          font-medium
          text-zinc-300
        "
      >
        {value}
      </p>
    </div>
  );
}