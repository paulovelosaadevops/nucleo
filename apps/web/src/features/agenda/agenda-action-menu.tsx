"use client";

import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/features/agenda/whatsapp-icon";
import { confirmDialog } from "@/lib/feedback";
import type { AgendaOccurrenceDetails } from "@/types/agenda";
import {
  Ban,
  Check,
  Copy,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface AgendaActionMenuProps {
  occurrence: AgendaOccurrenceDetails;
  loading: boolean;
  onComplete: (notes?: string) => Promise<void>;
  onCancel: (notes?: string) => Promise<void>;
  onDuplicate: () => Promise<void>;
  onDeleteOccurrence: () => Promise<void>;
  onDeleteSeries: () => Promise<void>;
  onShareWhatsApp: () => void;
}

export function AgendaActionMenu({
  occurrence,
  loading,
  onComplete,
  onCancel,
  onDuplicate,
  onDeleteOccurrence,
  onDeleteSeries,
  onShareWhatsApp,
}: AgendaActionMenuProps) {
  const [notes, setNotes] = useState("");
  const [actionError, setActionError] =
    useState<string | null>(null);

  const scheduled =
    occurrence.status === "SCHEDULED";

  const recurring =
    occurrence.recurrence &&
    occurrence.recurrence.frequency !== "NONE";

  async function execute(
    action: () => Promise<void>,
  ) {
    setActionError(null);

    try {
      await action();
    } catch {
      setActionError(
        "Não foi possível concluir esta ação.",
      );
    }
  }

  async function deleteOccurrence() {
    const confirmed = await confirmDialog({
      title: "Excluir ocorrencia",
      description: "Excluir somente esta ocorrencia?",
      confirmLabel: "Excluir",
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    await execute(onDeleteOccurrence);
  }

  async function deleteSeries() {
    const confirmed = await confirmDialog({
      title: "Excluir serie",
      description:
        "Excluir toda a serie recorrente? Esta acao nao podera ser desfeita.",
      confirmLabel: "Excluir serie",
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    await execute(onDeleteSeries);
  }

  return (
    <div className="border-t border-white/[0.07] pt-5">
      {scheduled && (
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-500">
            Observação da conclusão ou cancelamento
          </label>

          <textarea
            rows={2}
            maxLength={1000}
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            placeholder="Opcional"
            className="w-full resize-none rounded-2xl border border-white/[0.08] bg-black/25 px-3.5 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-white/20"
          />
        </div>
      )}

      {actionError && (
        <p className="mt-3 text-xs text-red-300">
          {actionError}
        </p>
      )}

      {scheduled && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            loading={loading}
            onClick={() =>
              void execute(() =>
                onComplete(
                  notes.trim() || undefined,
                ),
              )
            }
          >
            <Check className="h-4 w-4" />
            Concluir
          </Button>

          <Button
            variant="secondary"
            disabled={loading}
            onClick={() =>
              void execute(() =>
                onCancel(
                  notes.trim() || undefined,
                ),
              )
            }
          >
            <Ban className="h-4 w-4" />
            Cancelar
          </Button>
        </div>
      )}

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button
          variant="ghost"
          disabled={loading}
          aria-label="Enviar compromisso pelo WhatsApp"
          onClick={onShareWhatsApp}
        >
          <WhatsAppIcon className="h-4 w-4" />
          WhatsApp
        </Button>

        <Button
          variant="ghost"
          disabled={loading}
          onClick={() =>
            void execute(onDuplicate)
          }
        >
          <Copy className="h-4 w-4" />
          Duplicar
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2">
        <Button
          variant="danger"
          disabled={loading}
          onClick={() =>
            void deleteOccurrence()
          }
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
      </div>

      {recurring && (
        <Button
          variant="danger"
          className="mt-2 w-full"
          disabled={loading}
          onClick={() => void deleteSeries()}
        >
          <Trash2 className="h-4 w-4" />
          Excluir toda a série
        </Button>
      )}
    </div>
  );
}
