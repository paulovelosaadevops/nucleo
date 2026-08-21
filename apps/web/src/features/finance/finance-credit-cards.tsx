"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CircleX,
  CreditCard,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { financeService } from "./finance-service";
import { FinancialCardPurchaseForm } from "./financial-card-purchase-form";
import { FinancialCreditCardForm } from "./financial-credit-card-form";
import { FinancialInvoicePanel } from "./financial-invoice-panel";

import type {
  CreateFinancialCardPurchaseRequest,
  CreateFinancialCreditCardRequest,
  FinancialAccount,
  FinancialCategory,
  FinancialCreditCard,
  FinancialCreditCardPurchase,
  UpdateFinancialCardPurchaseRequest,
  UpdateFinancialCreditCardRequest,
} from "@/types/finance";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function purchasePeriod() {
  const today = new Date();

  return {
    from: `${today.getFullYear()}-01-01`,
    to: `${today.getFullYear()}-12-31`,
  };
}

export function FinanceCreditCards() {
  const [cards, setCards] = useState<FinancialCreditCard[]>([]);
  const [purchases, setPurchases] = useState<
    FinancialCreditCardPurchase[]
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

  const [cardFormOpen, setCardFormOpen] = useState(false);
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const period = purchasePeriod();

      const [
        cardsResult,
        purchasesResult,
        accountsResult,
        categoriesResult,
      ] = await Promise.all([
        financeService.creditCards.list(),
        financeService.cardPurchases.list(period),
        financeService.accounts.list(),
        financeService.categories.list("EXPENSE"),
      ]);

      setCards(cardsResult);
      setPurchases(purchasesResult);
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
    void loadData();
  }, [loadData]);

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
                          if (
                            window.confirm(
                              `Deseja excluir o cartão "${card.name}"?`,
                            )
                          ) {
                            void executeAction(card.id, () =>
                              financeService.creditCards.remove(
                                card.id,
                              ),
                            );
                          }
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

      {!loading && purchases.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="font-semibold text-white">
              Compras do ano
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {purchases.length} registradas
            </p>
          </div>

          {purchases.map((purchase) => (
            <article
              key={purchase.id}
              className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">
                  {purchase.description}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {purchase.creditCardName} •{" "}
                  {purchase.totalInstallments}x •{" "}
                  {purchase.categoryName ?? "Sem categoria"}
                </p>
              </div>

              <p className="font-semibold text-white">
                {currencyFormatter.format(purchase.totalAmount)}
              </p>

              {actionId === purchase.id ? (
                <LoaderCircle className="size-4 animate-spin text-zinc-500" />
              ) : (
                <div className="flex gap-1">
                  {purchase.status === "ACTIVE" ? (
                    <>
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => {
                          setEditingPurchase(purchase);
                          setPurchaseFormOpen(true);
                        }}
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        title="Cancelar"
                        onClick={() =>
                          void executeAction(purchase.id, () =>
                            financeService.cardPurchases.cancel(
                              purchase.id,
                            ),
                          )
                        }
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-amber-400/10 hover:text-amber-300"
                      >
                        <CircleX className="size-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      title="Restaurar"
                      onClick={() =>
                        void executeAction(purchase.id, () =>
                          financeService.cardPurchases.restore(
                            purchase.id,
                          ),
                        )
                      }
                      className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"
                    >
                      <RotateCcw className="size-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    title="Excluir"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Deseja excluir a compra "${purchase.description}"?`,
                        )
                      ) {
                        void executeAction(purchase.id, () =>
                          financeService.cardPurchases.remove(
                            purchase.id,
                          ),
                        );
                      }
                    }}
                    className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-rose-400/10 hover:text-rose-300"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}
            </article>
          ))}
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
          onChanged={loadData}
          onClose={() => setInvoiceCard(null)}
        />
      ) : null}
    </div>
  );
}