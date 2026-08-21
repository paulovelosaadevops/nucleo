"use client";

import { FormEvent, useMemo, useState } from "react";
import { LoaderCircle, X } from "lucide-react";

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
  onSubmit: (request: PurchaseFormRequest) => Promise<void>;
  onCancel: () => void;
}

const inputClassName =
  "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-white/25 disabled:opacity-50";

const labelClassName =
  "mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500";

function todayAsInputValue() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
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

  const [creditCardId, setCreditCardId] = useState(
    purchase?.creditCardId ?? cards.find((card) => card.active)?.id ?? "",
  );
  const [categoryId, setCategoryId] = useState(
    purchase?.categoryId ?? "",
  );
  const [description, setDescription] = useState(
    purchase?.description ?? "",
  );
  const [totalAmount, setTotalAmount] = useState(
    String(purchase?.totalAmount ?? ""),
  );
  const [purchaseDate, setPurchaseDate] = useState(
    purchase?.purchaseDate ?? todayAsInputValue(),
  );
  const [totalInstallments, setTotalInstallments] = useState(
    String(purchase?.totalInstallments ?? 1),
  );
  const [notes, setNotes] = useState(purchase?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const availableCards = useMemo(
    () =>
      cards.filter(
        (card) => card.active || card.id === creditCardId,
      ),
    [cards, creditCardId],
  );

  const expenseCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.type === "EXPENSE" &&
          (category.active || category.id === categoryId),
      ),
    [categories, categoryId],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (description.trim().length < 2) {
      setError("Informe uma descrição válida.");
      return;
    }

    try {
      if (editing) {
        const request: UpdateFinancialCardPurchaseRequest = {
          categoryId: categoryId || null,
          description: description.trim(),
          notes: notes.trim() || null,
        };

        await onSubmit(request);
        return;
      }

      const amount = Number(totalAmount);
      const installments = Number(totalInstallments);

      if (!creditCardId) {
        setError("Selecione um cartão.");
        return;
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        setError("Informe um valor maior que zero.");
        return;
      }

      if (
        !Number.isInteger(installments) ||
        installments < 1 ||
        installments > 360
      ) {
        setError("Informe uma quantidade válida de parcelas.");
        return;
      }

      const request: CreateFinancialCardPurchaseRequest = {
        creditCardId,
        categoryId: categoryId || null,
        description: description.trim(),
        totalAmount: amount,
        purchaseDate,
        totalInstallments: installments,
        notes: notes.trim() || null,
      };

      await onSubmit(request);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível salvar a compra.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6">
      <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#090909] sm:max-w-2xl sm:rounded-[2rem]">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-white/10 bg-[#090909]/95 p-5 backdrop-blur-xl sm:px-7">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Cartões
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {editing ? "Editar compra" : "Nova compra"}
            </h2>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onCancel}
            className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400"
          >
            <X className="size-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
          {!editing ? (
            <div>
              <label htmlFor="purchase-card" className={labelClassName}>
                Cartão
              </label>
              <select
                id="purchase-card"
                value={creditCardId}
                disabled={submitting}
                onChange={(event) =>
                  setCreditCardId(event.target.value)
                }
                className={inputClassName}
              >
                <option value="">Selecione</option>
                {availableCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name} •••• {card.lastFour}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label
              htmlFor="purchase-description"
              className={labelClassName}
            >
              Descrição
            </label>
            <input
              id="purchase-description"
              value={description}
              autoFocus
              maxLength={160}
              disabled={submitting}
              placeholder="Ex.: Supermercado"
              onChange={(event) =>
                setDescription(event.target.value)
              }
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="purchase-category"
              className={labelClassName}
            >
              Categoria
            </label>
            <select
              id="purchase-category"
              value={categoryId}
              disabled={submitting}
              onChange={(event) =>
                setCategoryId(event.target.value)
              }
              className={inputClassName}
            >
              <option value="">Sem categoria</option>
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {!editing ? (
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="purchase-amount"
                  className={labelClassName}
                >
                  Valor total
                </label>
                <input
                  id="purchase-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={totalAmount}
                  disabled={submitting}
                  onChange={(event) =>
                    setTotalAmount(event.target.value)
                  }
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="purchase-installments"
                  className={labelClassName}
                >
                  Parcelas
                </label>
                <input
                  id="purchase-installments"
                  type="number"
                  min="1"
                  max="360"
                  step="1"
                  value={totalInstallments}
                  disabled={submitting}
                  onChange={(event) =>
                    setTotalInstallments(event.target.value)
                  }
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="purchase-date"
                  className={labelClassName}
                >
                  Data
                </label>
                <input
                  id="purchase-date"
                  type="date"
                  value={purchaseDate}
                  disabled={submitting}
                  onChange={(event) =>
                    setPurchaseDate(event.target.value)
                  }
                  className={inputClassName}
                />
              </div>
            </div>
          ) : null}

          <div>
            <label
              htmlFor="purchase-notes"
              className={labelClassName}
            >
              Observações
            </label>
            <textarea
              id="purchase-notes"
              value={notes}
              maxLength={1000}
              rows={4}
              disabled={submitting}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-4 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <footer className="flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={submitting}
              onClick={onCancel}
              className="h-11 rounded-2xl border border-white/10 px-5 text-sm font-semibold text-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-semibold text-black disabled:opacity-60"
            >
              {submitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              {editing ? "Salvar alterações" : "Registrar compra"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}