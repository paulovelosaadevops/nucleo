"use client";

import { cn } from "@/lib/cn";
import {
  confirmDialog,
  promptDialog,
  toast,
} from "@/lib/feedback";
import type { ShoppingItem } from "@/types/shopping";
import {
  Check,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

interface ShoppingItemRowProps {
  item: ShoppingItem;
  disabled: boolean;
  onEdit: () => void;
  onPurchase: (
    actualUnitPrice?: number,
  ) => Promise<unknown>;
  onPending: () => Promise<unknown>;
  onCancel: () => Promise<unknown>;
  onRestore: () => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}

const currencyFormatter =
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const unitLabels: Record<string, string> = {
  UNIT: "un.",
  PACKAGE: "pct.",
  BOX: "cx.",
  BOTTLE: "gar.",
  CAN: "lata",
  LITER: "L",
  MILLILITER: "ml",
  KILOGRAM: "kg",
  GRAM: "g",
  METER: "m",
  DOZEN: "dz.",
};

export function ShoppingItemRow({
  item,
  disabled,
  onEdit,
  onPurchase,
  onPending,
  onCancel,
  onRestore,
  onDelete,
}: ShoppingItemRowProps) {
  const purchased =
    item.status === "PURCHASED";

  const cancelled =
    item.status === "CANCELLED";

  async function purchase() {
    const initialValue =
      item.estimatedUnitPrice != null
        ? String(item.estimatedUnitPrice)
        : "";

    const informedValue = await promptDialog({
      title: "Confirmar compra",
      description:
        "Informe o preço unitário real, se quiser atualizar o valor comprado.",
      label: "Preço unitário real",
      defaultValue: initialValue,
      inputMode: "decimal",
      confirmLabel: "Confirmar",
    });

    if (informedValue === null) {
      return;
    }

    const normalized =
      informedValue.trim().replace(",", ".");

    if (!normalized) {
      await onPurchase();
      return;
    }

    const value = Number(normalized);

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      toast({
        variant: "warning",
        message: "Informe um preço válido.",
      });
      return;
    }

    await onPurchase(value);
  }

  async function remove() {
    if (
      await confirmDialog({
        title: "Excluir item",
        description: `Excluir o item "${item.name}"?`,
        confirmLabel: "Excluir",
        variant: "danger",
      })
    ) {
      await onDelete();
    }
  }

  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border p-3.5 transition",
        purchased || cancelled
          ? "border-white/[0.05] bg-white/[0.018] opacity-65"
          : "border-white/[0.075] bg-white/[0.035]",
      )}
    >
      <button
        type="button"
        disabled={disabled || cancelled}
        onClick={() =>
          purchased
            ? void onPending()
            : void purchase()
        }
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition",
          purchased
            ? "border-white bg-white text-black"
            : "border-white/15 text-transparent hover:border-white/40 hover:text-zinc-500",
          cancelled &&
            "cursor-not-allowed border-white/[0.06]",
        )}
        aria-label={
          purchased
            ? "Marcar como pendente"
            : "Marcar como comprado"
        }
      >
        <Check className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-sm font-medium text-zinc-200",
                purchased &&
                  "line-through decoration-zinc-600",
                cancelled &&
                  "line-through decoration-zinc-700",
              )}
            >
              {item.name}
            </p>

            <p className="mt-1 text-[0.68rem] text-zinc-600">
              {item.quantity ?? 1}{" "}
              {unitLabels[item.unit ?? "UNIT"]}
              {item.assignedToName &&
                ` · ${item.assignedToName}`}
            </p>
          </div>

          <p className="shrink-0 text-xs font-medium text-zinc-400">
            {item.actualTotal != null
              ? currencyFormatter.format(
                  item.actualTotal,
                )
              : item.estimatedTotal != null
                ? currencyFormatter.format(
                    item.estimatedTotal,
                  )
                : "—"}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {!cancelled && (
            <ItemButton
              label="Editar"
              icon={Pencil}
              disabled={disabled}
              onClick={onEdit}
            />
          )}

          {item.status === "PENDING" && (
            <ItemButton
              label="Cancelar"
              icon={X}
              disabled={disabled}
              onClick={() => void onCancel()}
            />
          )}

          {cancelled && (
            <ItemButton
              label="Restaurar"
              icon={RotateCcw}
              disabled={disabled}
              onClick={() => void onRestore()}
            />
          )}

          <ItemButton
            label="Excluir"
            icon={Trash2}
            disabled={disabled}
            danger
            onClick={() => void remove()}
          />
        </div>
      </div>
    </div>
  );
}

interface ItemButtonProps {
  label: string;
  icon: typeof Pencil;
  disabled: boolean;
  danger?: boolean;
  onClick: () => void;
}

function ItemButton({
  label,
  icon: Icon,
  disabled,
  danger,
  onClick,
}: ItemButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-7 items-center gap-1 rounded-lg px-2 text-[0.65rem] transition disabled:opacity-40",
        danger
          ? "text-red-300/60 hover:bg-red-400/[0.08] hover:text-red-200"
          : "text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-300",
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
