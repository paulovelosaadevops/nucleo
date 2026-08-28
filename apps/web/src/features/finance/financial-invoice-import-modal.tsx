"use client";

import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import { confirmDialog } from "@/lib/feedback";
import type {
  FinancialCategory,
  FinancialCreditCard,
  FinancialInvoiceImport,
  FinancialInvoiceImportPreview,
  FinancialInvoiceImportPreviewItem,
  FinancialInvoiceImportResult,
} from "@/types/finance";
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  History,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { financeService } from "./finance-service";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

interface FinancialInvoiceImportModalProps {
  open: boolean;
  cards: FinancialCreditCard[];
  categories: FinancialCategory[];
  initialCardId: string | null;
  onClose: () => void;
  onImported: () => Promise<void>;
}

export function FinancialInvoiceImportModal({
  open,
  cards,
  categories,
  initialCardId,
  onClose,
  onImported,
}: FinancialInvoiceImportModalProps) {
  const [cardId, setCardId] = useState(initialCardId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] =
    useState<FinancialInvoiceImportPreview | null>(null);
  const [items, setItems] = useState<FinancialInvoiceImportPreviewItem[]>([]);
  const [result, setResult] =
    useState<FinancialInvoiceImportResult | null>(null);
  const [imports, setImports] = useState<FinancialInvoiceImport[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => {
      setCardId(initialCardId ?? cards[0]?.id ?? "");
      setFile(null);
      setPreview(null);
      setItems([]);
      setResult(null);
      setError(null);
      setShowHistory(false);
      void loadHistory();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [cards, initialCardId, open]);

  const selectedCount = items.filter((item) => item.included).length;
  const hasDifference = preview
    ? Math.abs(preview.difference) >= 0.01
    : false;

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.type === "EXPENSE"),
    [categories],
  );

  if (!open) return null;

  async function loadHistory() {
    try {
      setImports(await financeService.invoiceImports.list());
    } catch {
      setImports([]);
    }
  }

  async function processFile() {
    if (!cardId || !file) {
      setError("Selecione um cartão e envie um PDF ou CSV.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await financeService.invoiceImports.preview(cardId, file);
      setPreview(response);
      setItems(response.items);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível processar a fatura.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!preview) return;
    if (hasDifference) {
      const accepted = await confirmDialog({
        title: "Diferença encontrada",
        description:
          "O total processado difere do total informado na fatura. Deseja importar mesmo assim?",
        confirmLabel: "Importar com diferença",
        cancelLabel: "Revisar",
      });
      if (!accepted) return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await financeService.invoiceImports.confirm(
        preview.token,
        {
          acceptDifference: hasDifference,
          items: items.map((item) => ({
            id: item.id,
            included: item.included,
            date: item.date,
            description: item.description,
            amount: item.amount,
            installmentNumber: item.installmentNumber,
            totalInstallments: item.totalInstallments,
            type: item.type,
            categoryId: item.suggestedCategoryId,
          })),
        },
      );
      setResult(response);
      await onImported();
      await loadHistory();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível confirmar a importação.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function rollback(importId: string) {
    const accepted = await confirmDialog({
      title: "Desfazer importação",
      description:
        "Somente lançamentos criados por este lote serão removidos. Deseja continuar?",
      confirmLabel: "Desfazer",
      cancelLabel: "Cancelar",
      variant: "danger",
    });
    if (!accepted) return;
    setBusy(true);
    try {
      await financeService.invoiceImports.rollback(importId);
      await onImported();
      await loadHistory();
    } finally {
      setBusy(false);
    }
  }

  function updateItem(
    id: string,
    patch: Partial<FinancialInvoiceImportPreviewItem>,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    );
  }

  return (
    <ModalShell
      eyebrow="Faturas"
      title="Importar fatura"
      titleId="invoice-import-title"
      size="invoice"
      busy={busy}
      onClose={onClose}
    >
      <div className="max-h-[82vh] overflow-y-auto p-5 text-zinc-300 sm:p-7">
        {error ? (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
              Cartão
            </span>
            <select
              value={cardId}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none"
              onChange={(event) => setCardId(event.target.value)}
            >
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
              PDF ou CSV
            </span>
            <input
              type="file"
              accept=".pdf,.csv,application/pdf,text/csv"
              className="block h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-black"
              onChange={(event) =>
                setFile(event.target.files?.[0] ?? null)
              }
            />
          </label>

          <div className="flex items-end">
            <Button disabled={busy || !file} onClick={() => void processFile()}>
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <FileUp className="size-4" />
              )}
              Processar
            </Button>
          </div>
        </div>

        {preview ? (
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm sm:grid-cols-3">
              <Metric label="Competência" value={preview.referenceMonth.slice(0, 7)} />
              <Metric label="Vencimento" value={preview.dueDate} />
              <Metric label="Total informado" value={currencyFormatter.format(preview.statementTotal)} />
              <Metric label="Total processado" value={currencyFormatter.format(preview.processedTotal)} />
              <Metric label="Diferença" value={currencyFormatter.format(preview.difference)} />
              <Metric label="Parser" value={preview.parserName} />
            </div>

            {preview.sameFilePreviouslyImported || hasDifference || preview.warnings.length ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.08] p-3 text-sm text-amber-100">
                <AlertTriangle className="mr-2 inline size-4" />
                {preview.sameFilePreviouslyImported
                  ? "Este arquivo já foi importado para este cartão. "
                  : null}
                {hasDifference ? "Há diferença financeira para revisar. " : null}
                {preview.warnings.join(" ")}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setItems((current) => current.map((item) => ({ ...item, included: true })))}>
                Selecionar todos
              </Button>
              <Button variant="secondary" onClick={() => setItems((current) => current.map((item) => ({ ...item, included: false })))}>
                Desmarcar todos
              </Button>
              <Button disabled={busy || selectedCount === 0} onClick={() => void confirmImport()}>
                Confirmar importação
              </Button>
            </div>

            <div className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {items.map((item) => (
                <div key={item.id} className="grid gap-3 py-3 sm:grid-cols-[auto_7rem_minmax(0,1fr)_7rem_8rem_9rem] sm:items-center">
                  <input
                    type="checkbox"
                    checked={item.included}
                    onChange={(event) =>
                      updateItem(item.id, { included: event.target.checked })
                    }
                  />
                  <input
                    type="date"
                    value={item.date}
                    className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm"
                    onChange={(event) =>
                      updateItem(item.id, { date: event.target.value })
                    }
                  />
                  <input
                    value={item.description}
                    className="h-10 min-w-0 rounded-xl border border-white/10 bg-black/30 px-3 text-sm"
                    onChange={(event) =>
                      updateItem(item.id, { description: event.target.value })
                    }
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={item.amount}
                    className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm"
                    onChange={(event) =>
                      updateItem(item.id, { amount: Number(event.target.value) })
                    }
                  />
                  <select
                    value={item.type}
                    className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm"
                    onChange={(event) =>
                      updateItem(item.id, { type: event.target.value as FinancialInvoiceImportPreviewItem["type"] })
                    }
                  >
                    {["PURCHASE", "INSTALLMENT", "CREDIT", "REFUND", "FEE", "INTEREST", "IOF", "ADJUSTMENT"].map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <select
                    value={item.suggestedCategoryId ?? ""}
                    className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm"
                    onChange={(event) =>
                      updateItem(item.id, {
                        suggestedCategoryId: event.target.value || null,
                      })
                    }
                  >
                    <option value="">Sem categoria</option>
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-500 sm:col-start-3 sm:col-end-7">
                    {item.status}
                    {item.installmentNumber && item.totalInstallments
                      ? ` · Parcela ${item.installmentNumber}/${item.totalInstallments}`
                      : ""}
                    {item.problems.length ? ` · ${item.problems.join(", ")}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {result ? (
          <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] p-4 text-sm text-emerald-100">
            <CheckCircle2 className="mr-2 inline size-4" />
            {result.importedCount} lançamentos importados, {result.ignoredCount} ignorados e {result.duplicatedCount} duplicados.
          </div>
        ) : null}

        <div className="mt-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-300"
            onClick={() => setShowHistory((current) => !current)}
          >
            <History className="size-4" />
            Histórico de importações
          </button>

          {showHistory ? (
            <div className="mt-3 divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {imports.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{item.originalFileName}</p>
                    <p className="text-xs text-zinc-500">
                      {item.cardName} · {item.parserName} · {item.status} · {item.importedCount} lançamentos
                    </p>
                  </div>
                  {item.status === "CONFIRMED" ? (
                    <button
                      type="button"
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"
                      onClick={() => void rollback(item.id)}
                      aria-label="Desfazer importação"
                    >
                      <RotateCcw className="size-4" />
                    </button>
                  ) : null}
                </div>
              ))}
              {imports.length === 0 ? (
                <p className="py-4 text-sm text-zinc-500">Nenhuma importação registrada.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </ModalShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
