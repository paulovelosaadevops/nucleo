"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Check,
  LoaderCircle,
  MoreVertical,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/ui/modal-shell";
import { confirmDialog } from "@/lib/feedback";
import type {
  FinancialAccount,
  FinancialCreditCard,
  FinancialCreditCardInstallment,
  FinancialCreditCardInvoice,
  FinancialInvoiceCategorySummary,
  FinancialPaymentMethod,
} from "@/types/finance";

import { financeService } from "./finance-service";

interface FinancialInvoicePanelProps {
  card: FinancialCreditCard;
  accounts: FinancialAccount[];
  initialInvoiceId?: string | null;
  onChanged?: () => void;
  onClose: () => void;
}

type InvoiceTab = "items" | "categories";
type PurchaseTypeFilter = "ALL" | "DEBIT" | "CREDIT";
type SortMode = "date" | "amount";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
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
const paymentMethods: Array<{ value: FinancialPaymentMethod; label: string }> = [
  { value: "PIX", label: "Pix" },
  { value: "BANK_TRANSFER", label: "Transferência" },
  { value: "DIRECT_DEBIT", label: "Débito automático" },
  { value: "CASH", label: "Dinheiro" },
  { value: "OTHER", label: "Outro" },
];

function todayAsInputValue() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function date(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date(value));
}

function formatMonth(value: string) {
  const formatted = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date(value));
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

function invoiceStatusDetails(invoice: FinancialCreditCardInvoice) {
  const overdue = invoice.status === "CLOSED" && invoice.dueDate < todayAsInputValue();
  if (overdue) return { label: "Vencida", className: "border-red-400/20 bg-red-400/10 text-red-300" };
  return {
    OPEN: { label: "Aberta", className: "border-amber-400/20 bg-amber-400/10 text-amber-300" },
    CLOSED: { label: "Fechada", className: "border-sky-400/20 bg-sky-400/10 text-sky-300" },
    PAID: { label: "Paga", className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" },
    CANCELLED: { label: "Cancelada", className: "border-white/10 bg-white/[0.04] text-zinc-500" },
  }[invoice.status];
}

function installmentAmount(installment: FinancialCreditCardInstallment) {
  return installment.purchaseType === "CREDIT" ? -installment.amount : installment.amount;
}

function isFeeLike(installment: FinancialCreditCardInstallment) {
  const text = `${installment.purchaseDescription} ${installment.categoryName ?? ""}`.toLowerCase();
  return text.includes("iof") || text.includes("juros") || text.includes("multa") || text.includes("encargo");
}

function categoryKey(value: string | null) {
  return value ?? "uncategorized";
}

export function FinancialInvoicePanel({ card, accounts, initialInvoiceId, onChanged, onClose }: FinancialInvoicePanelProps) {
  const [invoices, setInvoices] = useState<FinancialCreditCardInvoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InvoiceTab>("items");
  const [paymentInvoice, setPaymentInvoice] = useState<FinancialCreditCardInvoice | null>(null);
  const [purchaseActionId, setPurchaseActionId] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<PurchaseTypeFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [accountId, setAccountId] = useState(card.paymentAccountId ?? "");
  const [paymentDate, setPaymentDate] = useState(todayAsInputValue());
  const [paymentMethod, setPaymentMethod] = useState<FinancialPaymentMethod>("PIX");
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [categorySummary, setCategorySummary] = useState<FinancialInvoiceCategorySummary[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    try {
      const response = await financeService.invoices.list(card.id);
      const ordered = orderInvoices(response);
      setInvoices(ordered);
      setError(null);
      setSelectedInvoiceId((current) => initialInvoiceId ?? current ?? ordered[0]?.id ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar as faturas.");
    } finally {
      setLoading(false);
    }
  }, [card.id, initialInvoiceId]);

  useEffect(() => {
    let active = true;
    financeService.invoices
      .list(card.id)
      .then((response) => {
        if (!active) return;
        const ordered = orderInvoices(response);
        setInvoices(ordered);
        setError(null);
        setSelectedInvoiceId((current) => initialInvoiceId ?? current ?? ordered[0]?.id ?? null);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar as faturas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [card.id, initialInvoiceId]);

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? invoices[0] ?? null,
    [invoices, selectedInvoiceId],
  );
  const selectedInstallments = useMemo(
    () => selectedInvoice ? [...selectedInvoice.installments].sort((left, right) => right.purchaseDate.localeCompare(left.purchaseDate)) : [],
    [selectedInvoice],
  );
  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    selectedInstallments.forEach((installment) => {
      map.set(categoryKey(installment.categoryId), installment.categoryName ?? "Sem categoria");
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name));
  }, [selectedInstallments]);
  const visibleInstallments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return selectedInstallments
      .filter((installment) => normalizedSearch === "" || installment.purchaseDescription.toLowerCase().includes(normalizedSearch))
      .filter((installment) => categoryFilter === "ALL" || categoryKey(installment.categoryId) === categoryFilter)
      .filter((installment) => typeFilter === "ALL" || installment.purchaseType === typeFilter)
      .sort((left, right) => {
        if (sortMode === "amount") return Math.abs(installmentAmount(right)) - Math.abs(installmentAmount(left));
        return right.purchaseDate.localeCompare(left.purchaseDate);
      });
  }, [categoryFilter, search, selectedInstallments, sortMode, typeFilter]);

  useEffect(() => {
    if (!selectedInvoice) {
      const timeout = window.setTimeout(() => {
        setCategorySummary([]);
        setCategoryFilter("ALL");
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    let active = true;
    const timeout = window.setTimeout(() => {
      if (active) {
        setSummaryLoading(true);
        setCategoryFilter("ALL");
      }
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
      window.clearTimeout(timeout);
    };
  }, [selectedInvoice]);

  async function executeAction(invoiceId: string, action: () => Promise<unknown>) {
    setActionId(invoiceId);
    setError(null);
    try {
      await action();
      await loadInvoices();
      onChanged?.();
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível realizar a ação.");
      return false;
    } finally {
      setActionId(null);
      setActionMenuOpen(false);
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!paymentInvoice) return;
    if (!accountId) {
      setError("Selecione a conta usada para pagar a fatura.");
      return;
    }
    if (!paymentDate) {
      setError("Informe a data do pagamento.");
      return;
    }

    const succeeded = await executeAction(paymentInvoice.id, () =>
      financeService.invoices.pay(paymentInvoice.id, { accountId, paymentDate, paymentMethod }),
    );
    if (succeeded) setPaymentInvoice(null);
  }

  async function deleteInvoice(invoiceId: string) {
    const succeeded = await executeAction(invoiceId, () => financeService.invoices.remove(invoiceId));
    if (succeeded) setSelectedInvoiceId(invoices.find((invoice) => invoice.id !== invoiceId)?.id ?? null);
  }

  async function deletePurchase(installment: FinancialCreditCardInstallment) {
    if (purchaseActionId) return;
    const confirmed = await confirmDialog({
      title: "Excluir compra",
      description:
        installment.totalInstallments > 1
          ? `Esta compra possui ${installment.totalInstallments} parcelas vinculadas. A exclusão removerá as parcelas permitidas pelas regras atuais. Deseja continuar?`
          : "Excluir esta compra da fatura?",
      confirmLabel: "Excluir",
      variant: "danger",
    });
    if (!confirmed) return;

    setPurchaseActionId(installment.purchaseId);
    setError(null);
    setMessage(null);
    try {
      await financeService.cardPurchases.remove(installment.purchaseId);
      await loadInvoices();
      onChanged?.();
      setMessage("Compra excluída da fatura.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível excluir a compra.");
    } finally {
      setPurchaseActionId(null);
    }
  }

  const selectedStatus = selectedInvoice ? invoiceStatusDetails(selectedInvoice) : null;
  const selectedProcessing = selectedInvoice ? actionId === selectedInvoice.id : false;

  return (
    <ModalShell
      eyebrow={card.lastFour ? `${card.name} •••• ${card.lastFour}` : card.name}
      title={selectedInvoice ? formatMonth(selectedInvoice.referenceMonth) : "Faturas"}
      titleId="invoice-panel-title"
      busy={Boolean(actionId)}
      size="invoice"
      onClose={onClose}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-white/10 bg-[#090909]/95 px-4 py-3 sm:px-5">
          {selectedInvoice ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedStatus ? <span className={`rounded-lg border px-2 py-1 text-[0.68rem] font-medium ${selectedStatus.className}`}>{selectedStatus.label}</span> : null}
                  <span className="text-xs text-zinc-500">Vence em {formatDate(selectedInvoice.dueDate)}</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-white">{currencyFormatter.format(selectedInvoice.totalAmount)}</p>
              </div>

              <div className="flex items-center gap-2">
                {invoices.length > 1 ? (
                  <select
                    value={selectedInvoice.id}
                    onChange={(event) => setSelectedInvoiceId(event.target.value)}
                    className="h-9 max-w-[11rem] rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none focus:border-white/30"
                  >
                    {invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{formatMonth(invoice.referenceMonth)}</option>)}
                  </select>
                ) : null}

                <InvoiceActions
                  invoice={selectedInvoice}
                  processing={selectedProcessing}
                  menuOpen={actionMenuOpen}
                  onMenuOpenChange={setActionMenuOpen}
                  onCloseInvoice={() => void executeAction(selectedInvoice.id, () => financeService.invoices.close(selectedInvoice.id))}
                  onPay={() => {
                    setAccountId(card.paymentAccountId ?? "");
                    setPaymentDate(todayAsInputValue());
                    setPaymentInvoice(selectedInvoice);
                  }}
                  onReopen={() => void executeAction(selectedInvoice.id, () => financeService.invoices.reopen(selectedInvoice.id))}
                  onReversePayment={() => void executeAction(selectedInvoice.id, () => financeService.invoices.reversePayment(selectedInvoice.id))}
                  onDeleteInvoice={() => {
                    void confirmDialog({
                      title: "Excluir fatura",
                      description: "Deseja excluir esta fatura vazia?",
                      confirmLabel: "Excluir",
                      variant: "danger",
                    }).then((confirmed) => {
                      if (confirmed) void deleteInvoice(selectedInvoice.id);
                    });
                  }}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex gap-1 rounded-xl bg-white/[0.04] p-1">
            {[
              ["items", "Lançamentos"],
              ["categories", "Categorias"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value as InvoiceTab)}
                className={activeTab === value ? "h-9 flex-1 rounded-lg bg-white text-sm font-semibold text-black" : "h-9 flex-1 rounded-lg text-sm font-medium text-zinc-400 hover:text-white"}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
          <div className="space-y-3">
            {message ? <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-sm text-emerald-200">{message}</div> : null}
            {error ? (
              <div role="alert" className="flex gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-4 text-sm leading-6 text-red-200">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            ) : null}
            {loading ? <div className="h-48 animate-pulse rounded-2xl bg-white/[0.04]" /> : null}

            {!loading && !error && invoices.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 p-8 text-center">
                <ReceiptText className="size-8 text-zinc-600" />
                <p className="mt-4 font-medium text-zinc-300">Nenhuma fatura encontrada</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">As faturas serão criadas automaticamente quando uma compra for registrada.</p>
              </div>
            ) : null}

            {!loading && selectedInvoice && activeTab === "items" ? (
              <>
                <InvoiceFilters
                  search={search}
                  categoryFilter={categoryFilter}
                  typeFilter={typeFilter}
                  sortMode={sortMode}
                  categories={categoryOptions}
                  filtersOpen={filtersOpen}
                  onFiltersOpenChange={setFiltersOpen}
                  onSearchChange={setSearch}
                  onCategoryChange={setCategoryFilter}
                  onTypeChange={setTypeFilter}
                  onSortChange={setSortMode}
                />
                <InstallmentList
                  installments={visibleInstallments}
                  deletingPurchaseId={purchaseActionId}
                  disabled={Boolean(purchaseActionId)}
                  onDelete={deletePurchase}
                />
              </>
            ) : null}

            {!loading && selectedInvoice && activeTab === "categories" ? (
              <CategoryTab
                summary={categorySummary}
                loading={summaryLoading}
                totalAmount={selectedInvoice.totalAmount}
                onSelectCategory={(id) => {
                  setCategoryFilter(categoryKey(id));
                  setActiveTab("items");
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      {paymentInvoice ? (
        <ModalShell
          eyebrow="Pagamento integral"
          title={`Pagar fatura de ${formatMonth(paymentInvoice.referenceMonth)}`}
          titleId="invoice-payment-title"
          busy={actionId === paymentInvoice.id}
          size="small"
          layer="nested"
          onClose={() => setPaymentInvoice(null)}
        >
          <form onSubmit={submitPayment} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-7">
              <p className="text-2xl font-semibold text-white">{currencyFormatter.format(paymentInvoice.totalAmount)}</p>
              <div>
                <label htmlFor="invoice-payment-account" className="mb-2 block text-sm font-medium text-zinc-300">Conta de pagamento</label>
                <select id="invoice-payment-account" value={accountId} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-white/30" onChange={(event) => setAccountId(event.target.value)}>
                  <option value="">Selecione a conta</option>
                  {accounts.filter((account) => account.active || account.id === accountId).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select>
              </div>
              <Input id="invoice-payment-date" label="Data do pagamento" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
              <div>
                <label htmlFor="invoice-payment-method" className="mb-2 block text-sm font-medium text-zinc-300">Forma de pagamento</label>
                <select id="invoice-payment-method" value={paymentMethod} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition focus:border-white/30" onChange={(event) => setPaymentMethod(event.target.value as FinancialPaymentMethod)}>
                  {paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
                </select>
              </div>
            </div>
            <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/10 bg-[#090909]/95 p-5 backdrop-blur-xl sm:flex-row sm:justify-end sm:px-7">
              <Button type="button" variant="secondary" disabled={actionId === paymentInvoice.id} onClick={() => setPaymentInvoice(null)}>Cancelar</Button>
              <Button type="submit" loading={actionId === paymentInvoice.id}>Confirmar pagamento</Button>
            </footer>
          </form>
        </ModalShell>
      ) : null}
    </ModalShell>
  );
}

function InvoiceActions({
  invoice,
  processing,
  menuOpen,
  onMenuOpenChange,
  onCloseInvoice,
  onPay,
  onReopen,
  onReversePayment,
  onDeleteInvoice,
}: {
  invoice: FinancialCreditCardInvoice;
  processing: boolean;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onCloseInvoice: () => void;
  onPay: () => void;
  onReopen: () => void;
  onReversePayment: () => void;
  onDeleteInvoice: () => void;
}) {
  if (processing) return <LoaderCircle className="size-5 animate-spin text-zinc-500" />;

  return (
    <div className="relative flex items-center gap-2">
      {invoice.status === "CLOSED" ? (
        <Button type="button" size="small" onClick={onPay}>
          <Check className="size-3.5" />
          Pagar fatura
        </Button>
      ) : null}
      {invoice.status === "OPEN" ? (
        <Button type="button" variant="secondary" size="small" onClick={onCloseInvoice}>Fechar</Button>
      ) : null}
      {invoice.status === "PAID" ? <span className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-300">Paga</span> : null}
      <button type="button" aria-label="Ações da fatura" onClick={() => onMenuOpenChange(!menuOpen)} className="flex size-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:bg-white/[0.06] hover:text-white">
        <MoreVertical className="size-4" />
      </button>
      {menuOpen ? (
        <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#111] p-1 shadow-2xl">
          {invoice.status === "CLOSED" ? <MenuButton onClick={onReopen}>Reabrir fatura</MenuButton> : null}
          {invoice.status === "PAID" ? <MenuButton onClick={onReversePayment}>Estornar pagamento</MenuButton> : null}
          {invoice.installments.length === 0 ? <MenuButton danger onClick={onDeleteInvoice}>Excluir fatura</MenuButton> : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({ children, danger = false, onClick }: { children: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={danger ? "block w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-400/10" : "block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-white"}>
      {children}
    </button>
  );
}

function InvoiceFilters({
  search,
  categoryFilter,
  typeFilter,
  sortMode,
  categories,
  filtersOpen,
  onFiltersOpenChange,
  onSearchChange,
  onCategoryChange,
  onTypeChange,
  onSortChange,
}: {
  search: string;
  categoryFilter: string;
  typeFilter: PurchaseTypeFilter;
  sortMode: SortMode;
  categories: Array<{ id: string; name: string }>;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTypeChange: (value: PurchaseTypeFilter) => void;
  onSortChange: (value: SortMode) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-2">
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar lançamento" className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pl-9 pr-3 text-sm text-white outline-none focus:border-white/30" />
        </label>
        <button type="button" onClick={() => onFiltersOpenChange(!filtersOpen)} className="flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-zinc-300 hover:bg-white/[0.06] sm:hidden">
          <SlidersHorizontal className="size-4" />
          Filtros
        </button>
      </div>
      <div className={(filtersOpen ? "grid" : "hidden") + " mt-2 gap-2 sm:grid sm:grid-cols-3"}>
        <select value={categoryFilter} onChange={(event) => onCategoryChange(event.target.value)} className="h-10 rounded-xl border border-white/10 bg-[#111] px-3 text-sm text-white outline-none">
          <option value="ALL">Todas as categorias</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select value={typeFilter} onChange={(event) => onTypeChange(event.target.value as PurchaseTypeFilter)} className="h-10 rounded-xl border border-white/10 bg-[#111] px-3 text-sm text-white outline-none">
          <option value="ALL">Todos os tipos</option>
          <option value="DEBIT">Compras</option>
          <option value="CREDIT">Créditos/estornos</option>
        </select>
        <select value={sortMode} onChange={(event) => onSortChange(event.target.value as SortMode)} className="h-10 rounded-xl border border-white/10 bg-[#111] px-3 text-sm text-white outline-none">
          <option value="date">Ordenar por data</option>
          <option value="amount">Ordenar por valor</option>
        </select>
      </div>
    </div>
  );
}

function InstallmentList({
  installments,
  deletingPurchaseId,
  disabled,
  onDelete,
}: {
  installments: FinancialCreditCardInstallment[];
  deletingPurchaseId: string | null;
  disabled: boolean;
  onDelete: (installment: FinancialCreditCardInstallment) => void;
}) {
  if (installments.length === 0) {
    return (
      <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-5 text-center text-sm text-zinc-500">
        Nenhum lançamento encontrado.
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/[0.07] overflow-hidden border-y border-white/[0.07]">
      {installments.map((installment) => {
        const signedAmount = installmentAmount(installment);
        const credit = installment.purchaseType === "CREDIT";
        const showInstallment = installment.purchaseType === "DEBIT" && (installment.totalInstallments > 1 || installment.installmentNumber > 1);
        return (
          <div key={installment.id} className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-1 py-2 transition hover:bg-white/[0.025] sm:grid-cols-[5rem_minmax(0,1fr)_8rem_2.5rem] sm:px-2">
            <p className="hidden text-xs text-zinc-500 sm:block">{formatShortDate(installment.purchaseDate)}</p>
            <div className="min-w-0">
              <div className="flex min-w-0 items-start justify-between gap-3 sm:block">
                <p title={installment.purchaseDescription} className="truncate text-sm font-medium text-zinc-200">{installment.purchaseDescription}</p>
                <p className={credit ? "shrink-0 text-sm font-semibold tabular-nums text-emerald-300 sm:hidden" : "shrink-0 text-sm font-semibold tabular-nums text-white sm:hidden"}>{currencyFormatter.format(signedAmount)}</p>
              </div>
              <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
                <span className="sm:hidden">{formatShortDate(installment.purchaseDate)}</span>
                <span className="truncate">{installment.categoryName ?? "Sem categoria"}</span>
                {showInstallment ? <span>Parcela {installment.installmentNumber}/{installment.totalInstallments}</span> : null}
                {credit ? <span className="text-emerald-300">Estorno/crédito</span> : null}
                {isFeeLike(installment) ? <span>Taxa</span> : null}
              </div>
            </div>
            <p className={credit ? "hidden text-right text-sm font-semibold tabular-nums text-emerald-300 sm:block" : "hidden text-right text-sm font-semibold tabular-nums text-white sm:block"}>{currencyFormatter.format(signedAmount)}</p>
            <button type="button" title="Ações" aria-label={`Ações de ${installment.purchaseDescription}`} disabled={deletingPurchaseId === installment.purchaseId || disabled} onClick={() => void onDelete(installment)} className="flex size-9 items-center justify-center rounded-xl text-zinc-500 outline-none transition hover:bg-rose-400/10 hover:text-rose-300 focus-visible:ring-2 focus-visible:ring-white/45 disabled:opacity-45">
              {deletingPurchaseId === installment.purchaseId ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function CategoryTab({
  summary,
  loading,
  totalAmount,
  onSelectCategory,
}: {
  summary: FinancialInvoiceCategorySummary[];
  loading: boolean;
  totalAmount: number;
  onSelectCategory: (categoryId: string | null) => void;
}) {
  const total = summary.reduce((sum, item) => sum + item.amount, 0);
  const segments = summary
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

  if (loading) return <div className="h-52 animate-pulse rounded-2xl bg-white/[0.04]" />;
  if (summary.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 text-sm text-zinc-500">
        Esta fatura não possui compras.
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-[13rem_minmax(0,1fr)] md:items-start">
      <div className="relative mx-auto grid size-44 place-items-center rounded-full" style={{ background: segments ? `conic-gradient(${segments})` : "conic-gradient(rgba(255,255,255,0.12) 0 100%)" }}>
        <div className="grid size-28 place-items-center rounded-full bg-[#090909] text-center">
          <span className="text-[0.65rem] text-zinc-500">Fatura</span>
          <span className="text-sm font-semibold text-white">{currencyFormatter.format(totalAmount)}</span>
        </div>
      </div>
      <div className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
        {summary.map((item, index) => {
          const color = categoryColor(item.categoryId, item.categoryName, index);
          return (
            <button key={item.categoryId ?? item.categoryName} type="button" onClick={() => onSelectCategory(item.categoryId)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2 text-left transition hover:bg-white/[0.025]">
              <div className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">{item.categoryName}</p>
                  <p className="text-xs text-zinc-500">{item.itemCount} lançamento(s) · {item.percentage.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</p>
                </div>
              </div>
              <span className={item.amount < 0 ? "text-sm font-semibold text-emerald-300" : "text-sm font-semibold text-white"}>{currencyFormatter.format(item.amount)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
