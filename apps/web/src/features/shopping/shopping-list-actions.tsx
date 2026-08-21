"use client";

import { Button } from "@/components/ui/button";
import type { ShoppingListDetails } from "@/types/shopping";
import {
  Archive,
  Check,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

interface ShoppingListActionsProps {
  list: ShoppingListDetails;
  loading: boolean;
  onEdit: () => void;
  onComplete: () => Promise<void>;
  onReopen: () => Promise<void>;
  onArchive: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function ShoppingListActions({
  list,
  loading,
  onEdit,
  onComplete,
  onReopen,
  onArchive,
  onDelete,
}: ShoppingListActionsProps) {
  async function archive() {
    if (
      window.confirm(
        "Arquivar esta lista?",
      )
    ) {
      await onArchive();
    }
  }

  async function remove() {
    if (
      window.confirm(
        "Excluir esta lista e todos os seus itens?",
      )
    ) {
      await onDelete();
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {list.status === "ACTIVE" && (
        <>
          <Button
            variant="secondary"
            disabled={loading}
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>

          <Button
            disabled={loading}
            onClick={() => void onComplete()}
          >
            <Check className="h-4 w-4" />
            Concluir
          </Button>
        </>
      )}

      {list.status === "COMPLETED" && (
        <Button
          variant="secondary"
          className="col-span-2"
          disabled={loading}
          onClick={() => void onReopen()}
        >
          <RotateCcw className="h-4 w-4" />
          Reabrir lista
        </Button>
      )}

      {list.status !== "ARCHIVED" && (
        <Button
          variant="ghost"
          disabled={loading}
          onClick={() => void archive()}
        >
          <Archive className="h-4 w-4" />
          Arquivar
        </Button>
      )}

      <Button
        variant="danger"
        disabled={loading}
        className={
          list.status === "ARCHIVED"
            ? "col-span-2"
            : undefined
        }
        onClick={() => void remove()}
      >
        <Trash2 className="h-4 w-4" />
        Excluir
      </Button>
    </div>
  );
}