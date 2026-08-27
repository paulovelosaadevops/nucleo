"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CreditCard,
  FileText,
  Pencil,
  Plus,
  Power,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { confirmDialog } from "@/lib/feedback";
import type {
  CreateFinancialCardPurchaseRequest,
  CreateFinancialCreditCardRequest,
  FinancialAccount,
  FinancialCategory,
  FinancialCreditCard,
  FinancialCreditCardInvoice,
  FinancialCreditCardPurchase,
  FinancialInvoiceCategorySummary,
  UpdateFinancialCardPurchaseRequest,
  UpdateFinancialCreditCardRequest,
} from "@/types/finance";

import { financeService } from "./finance-service";
import { FinancialCardPurchaseForm } from "./financial-card-purchase-form";
import { FinancialCreditCardForm } from "./financial-credit-card-form";
import { FinancialInvoicePanel } from "./financial-invoice-panel";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const shortMonthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const longMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR");
const categoryPalette = [
  "#8b5cf6",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#60a5fa",
  "#14b8a6",
  "#f97316",
  "#a3e635",
  "#c084fc",
];

function date(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string) {
  return dateFormatter.format(date(value));
}

function formatMonth(value: string) {
  const formatted = longMonthFormatter.format(date(value));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

function currentMonthKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function hashText(value: string) {
  return [...value].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function categoryColor(categoryId: string | null, categoryName: string, index = 0) {
  if (categoryId === "other") return "#8f8f99";
  return categoryPalette[(hashText(categoryId ?? categoryName) + index) % categoryPalette.length];
}

function orderInvoices(invoices: FinancialCreditCardInvoice[]) {
  const current = currentMonthKey();
  return [...invoices].sort((left, right) => {
    const leftKey = monthKey(left.referenceMonth);
    const rightKey = monthKey(right.referenceMonth);
    if (leftKey === current) return -1;
    if (rightKey === current) return 1;
    const leftFuture = leftKey > current;
    const rightFuture = rightKey > current;
    if (leftFuture !== rightFuture) return leftFuture ? -1 : 1;
    return leftFuture ? leftKey.localeCompare(rightKey) : rightKey.localeCompare(leftKey);
  });
}

function invoiceStatusLabel(status: FinancialCreditCardInvoice["status"]) {
  return {
    OPEN: "Aberta",
    CLOSED: "Fechada",
    PAID: "Paga",
    CANCELLED: "Cancelada",
  }[status];
}

function bestPurchaseDay(card: FinancialCreditCard) {
  return card.closingDay === 28 ? 1 : card.closingDay + 1;
}

function CompactMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="min-h-24 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <p className="truncate text-xs text-zinc-500">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-4 text-zinc-500">{detail}</p>
    </article>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <h2 className="mb-4 text-base font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function InvoiceCategoryChart({
  summary,
  loading,
  totalAmount,
}: {
  summary: FinancialInvoiceCategorySummary[];
  loading: boolean;
  totalAmount: number;
}) {
  const total = summary.reduce((sum, item) => sum + item.amount, 0);
  const top = summary.slice(0, 5);
  const other = summary.slice(5);
  const otherAmount = other.reduce((sum, item) => sum + item.amount, 0);
  const entries =
    other.length === 0
      ? top
      : [
          ...top,
          {
            categoryId: "other",
            categoryName: "Outras",
            color: "#8f8f99",
            amount: otherAmount,
            percentage: total > 0 ? (otherAmount / total) * 100 : 0,
            itemCount: other.reduce((sum, item) => sum + item.itemCount, 0),
            uncategorized: false,
          },
        ].filter((item) => item.amount !== 0);
  const segments = entries
    .filter((item) => item.amount > 0)
    .reduce<{ cursor: number; values: string[] }>(
      (state, item, index) => {
        const start = state.cursor;
        const share = total > 0 ? (item.amount / total) * 100 : 0;
        const end = start + share;
        return {
          cursor: end,
          values: [...state.values, `${categoryColor(item.categoryId, item.categoryName, index)} ${start}% ${end}%`],
        };
      },
      { cursor: 0, values: [] },
    )
    .values.join(", ");

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />;
  }

  if (summary.length === 0) {
    return (
      <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-5 text-center text-sm text-zinc-500">
        Esta fatura não possui compras.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[9.5rem_minmax(0,1fr)] md:items-center">
      <div
        className="relative mx-auto grid size-36 place-items-center rounded-full"
        style={{ background: segments ? `conic-gradient(${segments})` : "conic-gradient(rgba(255,255,255,0.12) 0 100%)" }}
        title={`Total da fatura: ${formatCurrency(totalAmount)}`}
      >
        <div className="grid size-24 place-items-center rounded-full bg-[#090909] text-center">
          <span className="text-[0.65rem] text-zinc-500">Fatura</span>
          <span className="text-xs font-semibold text-white">{formatCurrency(totalAmount)}</span>
        </div>
      </div>
      <div className="space-y-2">
        {entries.map((item, index) => {
          const color = categoryColor(item.categoryId, item.categoryName, index);
          return (
            <div key={item.categoryId ?? item.categoryName} title={`${item.categoryName}: ${formatCurrency(item.amount)}`} className="rounded-xl px-2 py-1 transition hover:bg-white/[0.05]">
              <div className="flex items-center gap-2 text-sm">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="min-w-0 flex-1 truncate text-zinc-300">{item.categoryName}</span>
                <span className="shrink-0 text-xs text-zinc-500">{item.percentage.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>
                <span className={item.amount < 0 ? "w-24 shrink-0 text-right font-medium text-emerald-300" : "w-24 shrink-0 text-right font-medium text-white"}>
                  {formatCurrency(item.amount)}
                </span>
              </div>
            </div>
          );
        })}
        {other.length > 0 ? <p className="text-xs text-zinc-500">Demais categorias agrupadas em Outras.</p> : null}
        {Math.abs(total - totalAmount) > 0.009 ? (
          <p className="text-xs leading-5 text-zinc-500">Total líquido por categoria: {formatCurrency(total)}.</p>
        ) : null}
      </div>
    </div>
  );
}

function InvoiceEvolution({
  invoices,
  selectedInvoiceId,
  months,
  onMonthsChange,
  onSelectInvoice,
}: {
  invoices: FinancialCreditCardInvoice[];
  selectedInvoiceId: string | null;
  months: 6 | 12;
  onMonthsChange: (value: 6 | 12) => void;
  onSelectInvoice: (invoiceId: string) => void;
}) {
  const ordered = [...invoices].sort((left, right) => left.referenceMonth.localeCompare(right.referenceMonth));
  const selectedIndex = Math.max(ordered.findIndex((invoice) => invoice.id === selectedInvoiceId), ordered.length - 1);
  const visible = ordered.slice(Math.max(selectedIndex - months + 1, 0), selectedIndex + 1);
  const max = Math.max(...visible.map((invoice) => Math.abs(invoice.totalAmount)), 1);
  const average =
    visible.length >= 3 && visible.some((invoice) => invoice.totalAmount > 0)
      ? visible.reduce((sum, invoice) => sum + Math.max(invoice.totalAmount, 0), 0) / visible.length
      : null;

  if (visible.length === 0) {
    return (
      <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 text-sm text-zinc-500">
        Nenhuma fatura para exibir.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1">
          {[6, 12].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onMonthsChange(option as 6 | 12)}
              className={months === option ? "h-8 rounded-lg bg-white px-3 text-xs font-medium text-black" : "h-8 rounded-lg px-3 text-xs font-medium text-zinc-400 hover:text-white"}
            >
              {option}m
            </button>
          ))}
        </div>
      </div>
      <div className="relative flex h-36 items-end gap-2 border-b border-white/10 pb-5">
        {average && average < max ? (
          <span className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-white/20" style={{ bottom: `calc(1.25rem + ${(average / max) * 100}% * 0.75)` }} />
        ) : null}
        {visible.map((invoice) => {
          const selected = invoice.id === selectedInvoiceId;
          const height = `${Math.max((Math.abs(invoice.totalAmount) / max) * 100, invoice.totalAmount ? 7 : 2)}%`;
          const label = shortMonthFormatter.format(date(invoice.referenceMonth)).replace(".", "");
          const future = monthKey(invoice.referenceMonth) > currentMonthKey();
          const statusClass =
            selected
              ? "border-white bg-white"
              : invoice.status === "PAID"
                ? "border-emerald-300/20 bg-emerald-300/60"
                : invoice.status === "CLOSED"
                  ? "border-sky-300/20 bg-sky-300/55"
                  : future
                    ? "border-white/10 bg-white/[0.16]"
                    : "border-white/10 bg-zinc-300";
          return (
            <button
              key={invoice.id}
              type="button"
              title={`${formatMonth(invoice.referenceMonth)} · ${invoiceStatusLabel(invoice.status)} · ${formatCurrency(invoice.totalAmount)}`}
              onClick={() => onSelectInvoice(invoice.id)}
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/45"
            >
              <span className={`w-full rounded-t-md border transition group-hover:border-white/30 ${statusClass}`} style={{ height }} />
              <span className={selected ? "truncate text-[0.62rem] uppercase text-white" : "truncate text-[0.62rem] uppercase text-zinc-500"}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InvoiceHistory({
  invoices,
  selectedInvoiceId,
  onSelectInvoice,
}: {
  invoices: FinancialCreditCardInvoice[];
  selectedInvoiceId: string | null;
  onSelectInvoice: (invoiceId: string) => void;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <h2 className="mb-3 text-base font-semibold text-white">Histórico de faturas</h2>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {invoices.slice(0, 8).map((invoice) => {
          const selected = invoice.id === selectedInvoiceId;
          return (
            <button
              key={invoice.id}
              type="button"
              onClick={() => onSelectInvoice(invoice.id)}
              className={selected ? "rounded-xl border border-white bg-white p-3 text-left text-black transition" : "rounded-xl border border-white/10 bg-black/10 p-3 text-left text-zinc-300 transition hover:bg-white/[0.06]"}
            >
              <p className="truncate text-sm font-semibold">{formatMonth(invoice.referenceMonth)}</p>
              <p className={selected ? "mt-1 text-xs text-zinc-700" : "mt-1 text-xs text-zinc-500"}>
                {invoiceStatusLabel(invoice.status)} · vence {formatDate(invoice.dueDate)}
              </p>
              <p className="mt-2 text-sm font-semibold">{formatCurrency(invoice.totalAmount)}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function FinanceCreditCards() {
  const [cards, setCards] = useState<FinancialCreditCard[]>([]);
  const [invoices, setInvoices] = useState<FinancialCreditCardInvoice[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [categorySummary, setCategorySummary] = useState<FinancialInvoiceCategorySummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [chartMonths, setChartMonths] = useState<6 | 12>(6);
  const [editingCard, setEditingCard] = useState<FinancialCreditCard | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<FinancialCreditCardPurchase | null>(null);
  const [invoiceCard, setInvoiceCard] = useState<FinancialCreditCard | null>(null);
  const [cardFormOpen, setCardFormOpen] = useState(false);
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === selectedCardId) ?? cards[0] ?? null,
    [cards, selectedCardId],
  );
  const selectedCardInvoices = useMemo(
    () => orderInvoices(invoices.filter((invoice) => invoice.creditCardId === selectedCard?.id)),
    [invoices, selectedCard?.id],
  );
  const selectedInvoice = useMemo(
    () => selectedCardInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? selectedCardInvoices[0] ?? null,
    [selectedCardInvoices, selectedInvoiceId],
  );
  const limitUsedPercentage = selectedCard && selectedCard.creditLimit > 0
    ? (selectedCard.outstandingAmount / selectedCard.creditLimit) * 100
    : 0;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cardsResult, accountsResult, categoriesResult] = await Promise.all([
        financeService.creditCards.list(),
        financeService.accounts.list(),
        financeService.categories.list("EXPENSE"),
      ]);
      const invoiceResults = await Promise.all(cardsResult.map((card) => financeService.invoices.list(card.id)));

      setCards(cardsResult);
      setInvoices(invoiceResults.flat());
      setAccounts(accountsResult);
      setCategories(categoriesResult);
      setSelectedCardId((current) => current ?? cardsResult[0]?.id ?? null);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar os cartões.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSelectedInvoiceId((current) =>
        selectedCardInvoices.some((invoice) => invoice.id === current)
          ? current
          : selectedCardInvoices[0]?.id ?? null,
      );
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [selectedCardInvoices]);

  useEffect(() => {
    if (!selectedInvoice) {
      const emptyTimeout = window.setTimeout(() => setCategorySummary([]), 0);
      return () => window.clearTimeout(emptyTimeout);
    }

    let active = true;
    const loadingTimeout = window.setTimeout(() => {
      if (active) setSummaryLoading(true);
    }, 0);

    financeService.invoices
      .categorySummary(selectedInvoice.id)
      .then((summary) => {
        if (active) setCategorySummary(summary);
      })
      .catch(() => {
        if (active) setCategorySummary([]);
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(loadingTimeout);
    };
  }, [selectedInvoice]);

  async function submitCard(request: CreateFinancialCreditCardRequest | UpdateFinancialCreditCardRequest) {
    setSubmitting(true);
    try {
      if (editingCard) {
        await financeService.creditCards.update(editingCard.id, request as UpdateFinancialCreditCardRequest);
      } else {
        await financeService.creditCards.create(request as CreateFinancialCreditCardRequest);
      }
      setCardFormOpen(false);
      setEditingCard(null);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPurchase(request: CreateFinancialCardPurchaseRequest | UpdateFinancialCardPurchaseRequest) {
    setSubmitting(true);
    try {
      if (editingPurchase) {
        await financeService.cardPurchases.update(editingPurchase.id, request as UpdateFinancialCardPurchaseRequest);
      } else {
        await financeService.cardPurchases.create(request as CreateFinancialCardPurchaseRequest);
      }
      setPurchaseFormOpen(false);
      setEditingPurchase(null);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  }

  async function executeAction(id: string, action: () => Promise<unknown>) {
    setActionId(id);
    setError(null);
    try {
      await action();
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível realizar a ação.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold text-white">Cartões de crédito</h2>
          <p className="mt-1 max-w-3xl text-sm text-zinc-500">
            Fatura atual é a fatura selecionada. Em aberto é o total de faturas abertas/fechadas do cartão.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={cards.length === 0} onClick={() => { setEditingPurchase(null); setPurchaseFormOpen(true); }} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-semibold text-zinc-300 disabled:opacity-40 sm:flex-none">
            <ShoppingBag className="size-4" />
            Nova compra
          </button>
          <button type="button" onClick={() => { setEditingCard(null); setCardFormOpen(true); }} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-black sm:flex-none">
            <Plus className="size-4" />
            Novo cartão
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-4 text-sm text-rose-200">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.035]" />
          ))}
        </div>
      ) : null}

      {!loading && cards.length === 0 ? (
        <div className="flex min-h-44 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 text-center">
          <CreditCard className="size-8 text-zinc-600" />
          <p className="mt-4 font-medium text-zinc-300">Nenhum cartão cadastrado</p>
        </div>
      ) : null}

      {!loading && selectedCard ? (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            <CompactMetric label="Fatura atual" value={formatCurrency(selectedInvoice?.totalAmount ?? 0)} detail={selectedInvoice ? `${formatMonth(selectedInvoice.referenceMonth)} · ${invoiceStatusLabel(selectedInvoice.status)}` : "Sem fatura selecionada"} />
            <CompactMetric label="Limite disponível" value={formatCurrency(selectedCard.availableLimit)} detail="Crédito livre no cartão selecionado" />
            <CompactMetric label="Limite utilizado" value={`${limitUsedPercentage.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`} detail={formatCurrency(selectedCard.outstandingAmount)} />
            <CompactMetric label="Vencimento" value={selectedInvoice ? formatDate(selectedInvoice.dueDate) : "-"} detail="Da fatura selecionada" />
            <CompactMetric label="Melhor dia" value={`Dia ${bestPurchaseDay(selectedCard)}`} detail={`Após fechamento no dia ${selectedCard.closingDay}`} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
            <section className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${selectedCard.color ?? "#ffffff"}, transparent 65%)` }} />
              <div className="relative space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <label className="text-xs text-zinc-500">
                    Cartão
                    <select value={selectedCard.id} onChange={(event) => setSelectedCardId(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-[#111] px-3 text-sm text-white outline-none focus:border-white/30">
                      {cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}
                    </select>
                  </label>
                  <label className="text-xs text-zinc-500">
                    Fatura
                    <select value={selectedInvoice?.id ?? ""} onChange={(event) => setSelectedInvoiceId(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-[#111] px-3 text-sm text-white outline-none focus:border-white/30">
                      {selectedCardInvoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{formatMonth(invoice.referenceMonth)}</option>)}
                    </select>
                  </label>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{selectedCard.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{selectedCard.brand} •••• {selectedCard.lastFour}</p>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(Math.max(limitUsedPercentage, 0), 100)}%` }} />
                </div>
                <div className="flex gap-1">
                  <button type="button" title="Abrir fatura" onClick={() => setInvoiceCard(selectedCard)} className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"><FileText className="size-4" /></button>
                  <button type="button" title="Editar" onClick={() => { setEditingCard(selectedCard); setCardFormOpen(true); }} className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"><Pencil className="size-4" /></button>
                  <button type="button" title={selectedCard.active ? "Desativar" : "Ativar"} disabled={actionId === selectedCard.id} onClick={() => void executeAction(selectedCard.id, () => selectedCard.active ? financeService.creditCards.deactivate(selectedCard.id) : financeService.creditCards.activate(selectedCard.id))} className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"><Power className="size-4" /></button>
                  <button type="button" title="Excluir" onClick={() => { void confirmDialog({ title: "Excluir cartão", description: `Deseja excluir o cartão "${selectedCard.name}"?`, confirmLabel: "Excluir", variant: "danger" }).then((confirmed) => { if (confirmed) void executeAction(selectedCard.id, () => financeService.creditCards.remove(selectedCard.id)); }); }} className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-rose-400/10 hover:text-rose-300"><Trash2 className="size-4" /></button>
                </div>
              </div>
            </section>

            <ChartCard title="Resumo da fatura">
              {selectedInvoice ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <CompactMetric label="Fechamento" value={formatDate(selectedInvoice.closingDate)} detail={`Vence em ${formatDate(selectedInvoice.dueDate)}`} />
                  <CompactMetric label="Itens" value={`${selectedInvoice.installments.length}`} detail="Parcelas desta fatura" />
                  <CompactMetric label="Total" value={formatCurrency(selectedInvoice.totalAmount)} detail="Débitos menos créditos/estornos" />
                </div>
              ) : (
                <div className="text-sm text-zinc-500">Nenhuma fatura encontrada para este cartão.</div>
              )}
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Gastos por categoria da fatura">
              <InvoiceCategoryChart summary={categorySummary} loading={summaryLoading} totalAmount={selectedInvoice?.totalAmount ?? 0} />
            </ChartCard>
            <ChartCard title="Evolução das faturas">
              <InvoiceEvolution invoices={selectedCardInvoices} selectedInvoiceId={selectedInvoice?.id ?? null} months={chartMonths} onMonthsChange={setChartMonths} onSelectInvoice={setSelectedInvoiceId} />
            </ChartCard>
          </div>

          <InvoiceHistory invoices={selectedCardInvoices} selectedInvoiceId={selectedInvoice?.id ?? null} onSelectInvoice={setSelectedInvoiceId} />
        </>
      ) : null}

      {cardFormOpen ? (
        <FinancialCreditCardForm key={editingCard?.id ?? "new-card"} card={editingCard} accounts={accounts} submitting={submitting} onSubmit={submitCard} onCancel={() => { if (!submitting) { setCardFormOpen(false); setEditingCard(null); } }} />
      ) : null}

      {purchaseFormOpen ? (
        <FinancialCardPurchaseForm key={editingPurchase?.id ?? "new-purchase"} purchase={editingPurchase} cards={cards} categories={categories} submitting={submitting} onSubmit={submitPurchase} onCancel={() => { if (!submitting) { setPurchaseFormOpen(false); setEditingPurchase(null); } }} />
      ) : null}

      {invoiceCard ? (
        <FinancialInvoicePanel card={invoiceCard} accounts={accounts} initialInvoiceId={selectedInvoice?.id ?? null} onChanged={loadData} onClose={() => setInvoiceCard(null)} />
      ) : null}
    </div>
  );
}
