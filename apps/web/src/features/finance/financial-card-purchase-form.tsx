"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  CalendarDays,
  CreditCard,
  Info,
  ShoppingBag,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  CreateFinancialCardPurchaseRequest,
  FinancialCategory,
  FinancialCreditCard,
  FinancialCreditCardPurchase,
  UpdateFinancialCardPurchaseRequest,
} from "@/types/finance";

type PurchaseFormRequest =
  | CreateFinancialCardPurchaseRequest
  | UpdateFinancialCardPurchaseRequest;

interface FinancialCardPurchaseFormProps {
  cards: FinancialCreditCard[];
  categories: FinancialCategory[];
  purchase?: FinancialCreditCardPurchase | null;
  submitting?: boolean;
  onSubmit: (
    request: PurchaseFormRequest,
  ) => Promise<void>;
  onCancel: () => void;
}

const currencyFormatter =
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const selectClassName =
  "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-[0.95rem] text-white outline-none transition hover:border-white/16 focus:border-white/30 focus:bg-white/[0.065] focus:ring-2 focus:ring-white/[0.06] disabled:opacity-50";

function todayAsInputValue() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseMoney(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return Number.NaN;
  }

  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;

  return Number(normalized);
}

function calculateFirstInvoiceDate(
  card: FinancialCreditCard,
  purchaseDate: string,
) {
  const [year, month, day] = purchaseDate
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return null;
  }

  let closingYear = year;
  let closingMonth = month - 1;

  if (day > card.closingDay) {
    closingMonth += 1;
  }

  if (closingMonth > 11) {
    closingMonth = 0;
    closingYear += 1;
  }

  let dueYear = closingYear;
  let dueMonth = closingMonth;

  if (card.dueDay <= card.closingDay) {
    dueMonth += 1;
  }

  if (dueMonth > 11) {
    dueMonth = 0;
    dueYear += 1;
  }

  return new Date(
    dueYear,
    dueMonth,
    card.dueDay,
  );
}

function formatMonth(value: Date | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(value);
}

export function FinancialCardPurchaseForm({
  cards,
  categories,
  purchase,
  submitting = false,
  onSubmit,
  onCancel,
}: FinancialCardPurchaseFormProps) {
  const editing = Boolean(purchase);

  const [creditCardId, setCreditCardId] =
    useState(
      purchase?.creditCardId ??
        cards.find((card) => card.active)?.id ??
        "",
    );

  const [categoryId, setCategoryId] =
    useState(purchase?.categoryId ?? "");

  const [description, setDescription] =
    useState(purchase?.description ?? "");

  const [totalAmount, setTotalAmount] =
    useState(
      purchase
        ? String(purchase.totalAmount)
        : "",
    );

  const [purchaseDate, setPurchaseDate] =
    useState(
      purchase?.purchaseDate ??
        todayAsInputValue(),
    );

  const [
    totalInstallments,
    setTotalInstallments,
  ] = useState(
    String(purchase?.totalInstallments ?? 1),
  );

  const [notes, setNotes] =
    useState(purchase?.notes ?? "");

  const [formError, setFormError] =
    useState<string | null>(null);

  const availableCards = useMemo(
    () =>
      cards.filter(
        (card) =>
          card.active ||
          card.id === creditCardId,
      ),
    [cards, creditCardId],
  );

  const expenseCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.type === "EXPENSE" &&
          (
            category.active ||
            category.id === categoryId
          ),
      ),
    [categories, categoryId],
  );

  const selectedCard = useMemo(
    () =>
      cards.find(
        (card) => card.id === creditCardId,
      ) ?? null,
    [cards, creditCardId],
  );

  const purchaseSummary = useMemo(() => {
    const amount = parseMoney(totalAmount);
    const installments = Number(
      totalInstallments,
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isInteger(installments) ||
      installments < 1 ||
      installments > 120
    ) {
      return null;
    }

    const totalCents = Math.round(
      amount * 100,
    );

    if (totalCents < installments) {
      return null;
    }

    const baseCents = Math.floor(
      totalCents / installments,
    );

    const remainder =
      totalCents % installments;

    const firstInstallment =
      (
        baseCents +
        (remainder > 0 ? 1 : 0)
      ) / 100;

    const lastInstallment =
      baseCents / 100;

    const firstInvoiceDate =
      selectedCard
        ? calculateFirstInvoiceDate(
            selectedCard,
            purchaseDate,
          )
        : null;

    return {
      amount,
      installments,
      firstInstallment,
      lastInstallment,
      firstInvoiceLabel:
        formatMonth(firstInvoiceDate),
    };
  }, [
    purchaseDate,
    selectedCard,
    totalAmount,
    totalInstallments,
  ]);

  const exceedsAvailableLimit =
    !editing &&
    selectedCard &&
    purchaseSummary &&
    purchaseSummary.amount >
      selectedCard.availableLimit;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError(null);

    const normalizedDescription =
      description.trim().replace(/\s+/g, " ");

    if (normalizedDescription.length < 2) {
      setFormError(
        "Informe uma descrição válida.",
      );
      return;
    }

    try {
      if (editing) {
        const request:
          UpdateFinancialCardPurchaseRequest =
          {
            categoryId:
              categoryId || null,
            description:
              normalizedDescription,
            notes:
              notes.trim() || null,
          };

        await onSubmit(request);
        return;
      }

      const amount =
        parseMoney(totalAmount);

      const installments =
        Number(totalInstallments);

      if (!creditCardId) {
        setFormError(
          "Selecione um cartão.",
        );
        return;
      }

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        setFormError(
          "Informe um valor maior que zero.",
        );
        return;
      }

      if (
        !/^\d+(?:[.,]\d{1,2})?$/.test(
          totalAmount.trim(),
        )
      ) {
        setFormError(
          "O valor deve possuir no máximo duas casas decimais.",
        );
        return;
      }

      if (
        !Number.isInteger(installments) ||
        installments < 1 ||
        installments > 120
      ) {
        setFormError(
          "A quantidade de parcelas deve estar entre 1 e 120.",
        );
        return;
      }

      if (
        Math.round(amount * 100) <
        installments
      ) {
        setFormError(
          "O valor é muito baixo para a quantidade de parcelas.",
        );
        return;
      }

      if (!purchaseDate) {
        setFormError(
          "Informe a data da compra.",
        );
        return;
      }

      const request:
        CreateFinancialCardPurchaseRequest =
        {
          creditCardId,
          categoryId:
            categoryId || null,
          description:
            normalizedDescription,
          totalAmount: amount,
          purchaseDate,
          totalInstallments:
            installments,
          notes:
            notes.trim() || null,
        };

      await onSubmit(request);
    } catch (submissionError) {
      setFormError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível salvar a compra.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-purchase-title"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#090909] shadow-2xl sm:max-w-2xl sm:rounded-[2rem]"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-white/10 bg-[#090909]/95 p-5 backdrop-blur-xl sm:px-7">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Cartões
            </p>

            <h2
              id="card-purchase-title"
              className="mt-1 text-xl font-semibold text-white"
            >
              {editing
                ? "Editar compra"
                : "Nova compra"}
            </h2>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={submitting}
            aria-label="Fechar formulário"
            onClick={onCancel}
          >
            <X className="size-4" />
          </Button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-5 sm:p-7"
          noValidate
        >
          {!editing ? (
            <div>
              <label
                htmlFor="purchase-card"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Cartão
              </label>

              <select
                id="purchase-card"
                value={creditCardId}
                disabled={submitting}
                className={selectClassName}
                onChange={(event) => {
                  setCreditCardId(
                    event.target.value,
                  );
                  setFormError(null);
                }}
              >
                <option value="">
                  Selecione
                </option>

                {availableCards.map((card) => (
                  <option
                    key={card.id}
                    value={card.id}
                  >
                    {card.name} ••••{" "}
                    {card.lastFour}
                  </option>
                ))}
              </select>

              {selectedCard ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Limite disponível:{" "}
                  {currencyFormatter.format(
                    selectedCard.availableLimit,
                  )}
                </p>
              ) : null}
            </div>
          ) : null}

          <Input
            id="purchase-description"
            label="Descrição"
            value={description}
            autoFocus
            required
            maxLength={160}
            disabled={submitting}
            placeholder="Ex.: Supermercado"
            leadingIcon={
              <ShoppingBag className="size-4" />
            }
            onChange={(event) => {
              setDescription(
                event.target.value,
              );
              setFormError(null);
            }}
          />

          <div>
            <label
              htmlFor="purchase-category"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Categoria
            </label>

            <select
              id="purchase-category"
              value={categoryId}
              disabled={submitting}
              className={selectClassName}
              onChange={(event) => {
                setCategoryId(
                  event.target.value,
                );
                setFormError(null);
              }}
            >
              <option value="">
                Sem categoria
              </option>

              {expenseCategories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ),
              )}
            </select>
          </div>

          {!editing ? (
            <div className="grid gap-5 sm:grid-cols-3">
              <Input
                id="purchase-amount"
                label="Valor total"
                type="text"
                inputMode="decimal"
                value={totalAmount}
                disabled={submitting}
                placeholder="0,00"
                onChange={(event) => {
                  setTotalAmount(
                    event.target.value,
                  );
                  setFormError(null);
                }}
              />

              <Input
                id="purchase-installments"
                label="Parcelas"
                type="number"
                min="1"
                max="120"
                step="1"
                value={totalInstallments}
                disabled={submitting}
                onChange={(event) => {
                  setTotalInstallments(
                    event.target.value,
                  );
                  setFormError(null);
                }}
              />

              <Input
                id="purchase-date"
                label="Data da compra"
                type="date"
                value={purchaseDate}
                disabled={submitting}
                leadingIcon={
                  <CalendarDays className="size-4" />
                }
                onChange={(event) => {
                  setPurchaseDate(
                    event.target.value,
                  );
                  setFormError(null);
                }}
              />
            </div>
          ) : null}

          {!editing && purchaseSummary ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex gap-3">
                <CreditCard className="mt-0.5 size-4 shrink-0 text-zinc-400" />

                <div className="space-y-1 text-sm">
                  <p className="font-medium text-zinc-200">
                    {purchaseSummary.installments}
                    x de aproximadamente{" "}
                    {currencyFormatter.format(
                      purchaseSummary.firstInstallment,
                    )}
                  </p>

                  {purchaseSummary.firstInstallment !==
                  purchaseSummary.lastInstallment ? (
                    <p className="text-xs text-zinc-500">
                      A última parcela será de{" "}
                      {currencyFormatter.format(
                        purchaseSummary.lastInstallment,
                      )}
                      .
                    </p>
                  ) : null}

                  {purchaseSummary.firstInvoiceLabel ? (
                    <p className="text-xs capitalize text-zinc-500">
                      Primeira fatura:{" "}
                      {
                        purchaseSummary.firstInvoiceLabel
                      }
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {exceedsAvailableLimit ? (
            <div className="flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm leading-6 text-amber-200">
              <Info className="mt-0.5 size-4 shrink-0" />

              O valor da compra ultrapassa o
              limite disponível informado para
              este cartão.
            </div>
          ) : null}

          <div>
            <label
              htmlFor="purchase-notes"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Observações
            </label>

            <textarea
              id="purchase-notes"
              value={notes}
              maxLength={1000}
              rows={4}
              disabled={submitting}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 hover:border-white/16 focus:border-white/30 focus:bg-white/[0.065] focus:ring-2 focus:ring-white/[0.06]"
              onChange={(event) => {
                setNotes(event.target.value);
                setFormError(null);
              }}
            />
          </div>

          {formError ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-4 text-sm leading-6 text-red-200"
            >
              {formError}
            </div>
          ) : null}

          <footer className="flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={onCancel}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              loading={submitting}
            >
              {editing
                ? "Salvar alterações"
                : "Registrar compra"}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}