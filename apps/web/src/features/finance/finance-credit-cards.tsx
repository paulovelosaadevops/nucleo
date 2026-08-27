"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CreditCard,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { financeService } from "./finance-service";
import { FinancialCardPurchaseForm } from "./financial-card-purchase-form";
import { FinancialCreditCardForm } from "./financial-credit-card-form";
import { FinancialInvoicePanel } from "./financial-invoice-panel";
import { confirmDialog } from "@/lib/feedback";

import type {
  CreateFinancialCardPurchaseRequest,
  CreateFinancialCreditCardRequest,
  FinancialAccount,
  FinancialCategory,
  FinancialCreditCard,
  FinancialCreditCardInvoice,
  FinancialCreditCardPurchase,
  UpdateFinancialCardPurchaseRequest,
  UpdateFinancialCreditCardRequest,
} from "@/types/finance";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const shortMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
});

const longMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR");

function date(value: string) {
  return new Date(`${value}T00:00:00`);
}

function invoiceYear(invoice: FinancialCreditCardInvoice) {
  return date(invoice.referenceMonth).getFullYear();
}

function invoiceMonthIndex(invoice: FinancialCreditCardInvoice) {
  return date(invoice.referenceMonth).getMonth();
}

function invoiceStatusLabel(status: FinancialCreditCardInvoice["status"]) {
  const labels = {
    OPEN: "Aberta",
    CLOSED: "Fechada",
    PAID: "Paga",
    CANCELLED: "Cancelada",
  };

  return labels[status];
}

export function FinanceCreditCards() {
  const [cards, setCards] = useState<FinancialCreditCard[]>([]);
  const [invoices, setInvoices] = useState<
    FinancialCreditCardInvoice[]
  >([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<
    FinancialCategory[]
  >([]);

  const [editingCard, setEditingCard] =
    useState<FinancialCreditCard | null>(null);
  const [editingPurchase, setEditingPurchase] =
    useState<FinancialCreditCardPurchase | null>(null);
  const [invoiceCard, setInvoiceCard] =
    useState<FinancialCreditCard | null>(null);
  const [initialInvoiceId, setInitialInvoiceId] =
    useState<string | null>(null);

  const [cardFormOpen, setCardFormOpen] = useState(false);
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear(),
  );

  const totalLimit = useMemo(
    () =>
      cards
        .filter((card) => card.active)
        .reduce((total, card) => total + card.creditLimit, 0),
    [cards],
  );

  const totalAvailable = useMemo(
    () =>
      cards
        .filter((card) => card.active)
        .reduce(
          (total, card) => total + card.availableLimit,
          0,
        ),
    [cards],
  );

  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(invoices.map((invoice) => invoiceYear(invoice))),
    ).sort((left, right) => left - right);

    return years.length > 0 ? years : [selectedYear];
  }, [invoices, selectedYear]);

  const invoiceChartMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const monthInvoices = invoices.filter(
        (item) =>
          invoiceYear(item) === selectedYear &&
          invoiceMonthIndex(item) === monthIndex,
      );
      const invoice = monthInvoices[0] ?? null;
      const monthDate = new Date(selectedYear, monthIndex, 1);

      return {
        monthIndex,
        invoice,
        invoices: monthInvoices,
        label: shortMonthFormatter
          .format(monthDate)
          .replace(".", ""),
        fullLabel: longMonthFormatter.format(monthDate),
        amount: monthInvoices.reduce(
          (total, item) => total + item.totalAmount,
          0,
        ),
      };
    });
  }, [invoices, selectedYear]);

  const maxInvoiceAmount = Math.max(
    ...invoiceChartMonths.map((month) => month.amount),
    1,
  );

  const selectedYearIndex = availableYears.indexOf(selectedYear);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        cardsResult,
        accountsResult,
        categoriesResult,
      ] = await Promise.all([
        financeService.creditCards.list(),
        financeService.accounts.list(),
        financeService.categories.list("EXPENSE"),
      ]);

      const invoiceResults = await Promise.all(
        cardsResult.map((card) =>
          financeService.invoices.list(card.id),
        ),
      );

      setCards(cardsResult);
      setInvoices(invoiceResults.flat());
      setAccounts(accountsResult);
      setCategories(categoriesResult);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar os cartões.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([
      financeService.creditCards.list(),
      financeService.accounts.list(),
      financeService.categories.list("EXPENSE"),
    ])
      .then(async ([cardsResult, accountsResult, categoriesResult]) => {
        const invoiceResults = await Promise.all(
          cardsResult.map((card) =>
            financeService.invoices.list(card.id),
          ),
        );

        if (!active) {
          return;
        }

        setCards(cardsResult);
        setInvoices(invoiceResults.flat());
        setAccounts(accountsResult);
        setCategories(categoriesResult);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (!active) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar os cartões.",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function submitCard(
    request:
      | CreateFinancialCreditCardRequest
      | UpdateFinancialCreditCardRequest,
  ) {
    setSubmitting(true);

    try {
      if (editingCard) {
        await financeService.creditCards.update(
          editingCard.id,
          request as UpdateFinancialCreditCardRequest,
        );
      } else {
        await financeService.creditCards.create(
          request as CreateFinancialCreditCardRequest,
        );
      }

      setCardFormOpen(false);
      setEditingCard(null);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPurchase(
    request:
      | CreateFinancialCardPurchaseRequest
      | UpdateFinancialCardPurchaseRequest,
  ) {
    setSubmitting(true);

    try {
      if (editingPurchase) {
        await financeService.cardPurchases.update(
          editingPurchase.id,
          request as UpdateFinancialCardPurchaseRequest,
        );
      } else {
        await financeService.cardPurchases.create(
          request as CreateFinancialCardPurchaseRequest,
        );
      }

      setPurchaseFormOpen(false);
      setEditingPurchase(null);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  }

  async function executeAction(
    id: string,
    action: () => Promise<unknown>,
  ) {
    setActionId(id);
    setError(null);

    try {
      await action();
      await loadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível realizar a ação.",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Limite total
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            {currencyFormatter.format(totalLimit)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Limite disponível
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            {currencyFormatter.format(totalAvailable)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold text-white">
            Cartões de crédito
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Limites, compras e faturas
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={cards.length === 0}
            onClick={() => {
              setEditingPurchase(null);
              setPurchaseFormOpen(true);
            }}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 text-sm font-semibold text-zinc-300 disabled:opacity-40 sm:flex-none"
          >
            <ShoppingBag className="size-4" />
            Nova compra
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingCard(null);
              setCardFormOpen(true);
            }}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-black sm:flex-none"
          >
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
        <div className="flex min-h-60 items-center justify-center">
          <LoaderCircle className="size-6 animate-spin text-zinc-500" />
        </div>
      ) : null}

      {!loading && cards.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 text-center">
          <CreditCard className="size-8 text-zinc-600" />
          <p className="mt-4 font-medium text-zinc-300">
            Nenhum cartão cadastrado
          </p>
        </div>
      ) : null}

      {!loading && cards.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.id}
              className={[
                "relative overflow-hidden rounded-[1.75rem] border p-5",
                card.active
                  ? "border-white/10 bg-white/[0.04]"
                  : "border-white/[0.06] bg-white/[0.015] opacity-60",
              ].join(" ")}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: `linear-gradient(135deg, ${card.color ?? "#ffffff"}, transparent 65%)`,
                }}
              />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      {card.name}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      {card.brand} •••• {card.lastFour}
                    </p>
                  </div>

                  {actionId === card.id ? (
                    <LoaderCircle className="size-4 animate-spin text-zinc-500" />
                  ) : (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        title="Faturas"
                        onClick={() => setInvoiceCard(card)}
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"
                      >
                        <FileText className="size-4" />
                      </button>
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => {
                          setEditingCard(card);
                          setCardFormOpen(true);
                        }}
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        title={card.active ? "Desativar" : "Ativar"}
                        onClick={() =>
                          void executeAction(card.id, () =>
                            card.active
                              ? financeService.creditCards.deactivate(
                                  card.id,
                                )
                              : financeService.creditCards.activate(
                                  card.id,
                                ),
                          )
                        }
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"
                      >
                        <Power className="size-4" />
                      </button>
                      <button
                        type="button"
                        title="Excluir"
                        onClick={() => {
                          void confirmDialog({
                            title: "Excluir cartão",
                            description: `Deseja excluir o cartão "${card.name}"?`,
                            confirmLabel: "Excluir",
                            variant: "danger",
                          }).then((confirmed) => {
                            if (confirmed) {
                            void executeAction(card.id, () =>
                              financeService.creditCards.remove(
                                card.id,
                              ),
                            );
                          }
                          });
                        }}
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-rose-400/10 hover:text-rose-300"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-600">Disponível</p>
                    <p className="mt-1 font-semibold text-white">
                      {currencyFormatter.format(card.availableLimit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600">Em aberto</p>
                    <p className="mt-1 font-semibold text-zinc-300">
                      {currencyFormatter.format(card.outstandingAmount)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          (card.outstandingAmount /
                            card.creditLimit) *
                            100,
                          0,
                        ),
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {!loading && cards.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-white">
                Evolução das faturas
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Totais reais por mês, sem compras futuras não geradas
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Ano anterior"
                disabled={selectedYearIndex <= 0}
                onClick={() =>
                  setSelectedYear(availableYears[selectedYearIndex - 1])
                }
                className="flex size-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 disabled:opacity-40"
              >
                {"<"}
              </button>
              <span className="min-w-16 text-center text-sm font-semibold text-white">
                {selectedYear}
              </span>
              <button
                type="button"
                aria-label="Próximo ano"
                disabled={selectedYearIndex >= availableYears.length - 1}
                onClick={() =>
                  setSelectedYear(availableYears[selectedYearIndex + 1])
                }
                className="flex size-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 disabled:opacity-40"
              >
                {">"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid h-48 grid-cols-12 items-end gap-1.5 border-b border-white/10 pb-6 sm:gap-3">
            {invoiceChartMonths.map((month) => {
              const height = `${Math.max(
                (month.amount / maxInvoiceAmount) * 100,
                month.amount > 0 ? 8 : 2,
              )}%`;
              const relatedCard = month.invoice
                ? cards.find((card) => card.id === month.invoice?.creditCardId)
                : null;
              const title = month.invoice
                ? `${month.fullLabel}: ${currencyFormatter.format(month.amount)} em ${month.invoices.length} fatura(s). Vence ${dateFormatter.format(date(month.invoice.dueDate))}. ${invoiceStatusLabel(month.invoice.status)}.`
                : `${month.fullLabel}: ${currencyFormatter.format(0)}`;

              return (
                <button
                  key={month.monthIndex}
                  type="button"
                  title={title}
                  aria-label={title}
                  disabled={!month.invoice || !relatedCard}
                  onClick={() => {
                    if (!month.invoice || !relatedCard) {
                      return;
                    }

                    setInitialInvoiceId(month.invoice.id);
                    setInvoiceCard(relatedCard);
                  }}
                  className="group flex h-full min-w-0 flex-col items-center justify-end gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/45 disabled:cursor-default"
                >
                  <span
                    className={[
                      "w-full rounded-t-md border border-white/10 transition group-hover:border-white/30",
                      month.invoice?.status === "PAID"
                        ? "bg-emerald-300/70"
                        : month.invoice?.status === "CANCELLED"
                          ? "bg-zinc-700/60"
                          : month.invoice
                            ? "bg-zinc-100"
                            : "bg-white/[0.08]",
                    ].join(" ")}
                    style={{ height }}
                  />
                  <span className="text-[0.62rem] uppercase text-zinc-500 sm:text-xs">
                    {month.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
      {cardFormOpen ? (
        <FinancialCreditCardForm
          key={editingCard?.id ?? "new-card"}
          card={editingCard}
          accounts={accounts}
          submitting={submitting}
          onSubmit={submitCard}
          onCancel={() => {
            if (!submitting) {
              setCardFormOpen(false);
              setEditingCard(null);
            }
          }}
        />
      ) : null}

      {purchaseFormOpen ? (
        <FinancialCardPurchaseForm
          key={editingPurchase?.id ?? "new-purchase"}
          purchase={editingPurchase}
          cards={cards}
          categories={categories}
          submitting={submitting}
          onSubmit={submitPurchase}
          onCancel={() => {
            if (!submitting) {
              setPurchaseFormOpen(false);
              setEditingPurchase(null);
            }
          }}
        />
      ) : null}

      {invoiceCard ? (
        <FinancialInvoicePanel
          card={invoiceCard}
          accounts={accounts}
          initialInvoiceId={initialInvoiceId}
          onChanged={loadData}
          onClose={() => {
            setInvoiceCard(null);
            setInitialInvoiceId(null);
          }}
        />
      ) : null}
    </div>
  );
}
