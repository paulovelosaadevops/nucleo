"use client";

import { FormEvent, useMemo, useState } from "react";
import { LoaderCircle, X } from "lucide-react";

import type {
  CreateFinancialCreditCardRequest,
  FinancialAccount,
  FinancialCreditCard,
  FinancialCreditCardBrand,
  UpdateFinancialCreditCardRequest,
} from "@/types/finance";

type CreditCardFormRequest =
  | CreateFinancialCreditCardRequest
  | UpdateFinancialCreditCardRequest;

interface FinancialCreditCardFormProps {
  accounts: FinancialAccount[];
  card?: FinancialCreditCard | null;
  submitting?: boolean;
  onSubmit: (request: CreditCardFormRequest) => Promise<void>;
  onCancel: () => void;
}

const brands: Array<{
  value: FinancialCreditCardBrand;
  label: string;
}> = [
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
  { value: "ELO", label: "Elo" },
  { value: "AMERICAN_EXPRESS", label: "American Express" },
  { value: "HIPERCARD", label: "Hipercard" },
  { value: "OTHER", label: "Outra" },
];

const inputClassName =
  "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-white/25 disabled:opacity-50";

const labelClassName =
  "mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500";

export function FinancialCreditCardForm({
  accounts,
  card,
  submitting = false,
  onSubmit,
  onCancel,
}: FinancialCreditCardFormProps) {
  const [name, setName] = useState(card?.name ?? "");
  const [brand, setBrand] = useState<FinancialCreditCardBrand>(
    card?.brand ?? "MASTERCARD",
  );
  const [lastFour, setLastFour] = useState(card?.lastFour ?? "");
  const [creditLimit, setCreditLimit] = useState(
    String(card?.creditLimit ?? ""),
  );
  const [closingDay, setClosingDay] = useState(
    String(card?.closingDay ?? 20),
  );
  const [dueDay, setDueDay] = useState(
    String(card?.dueDay ?? 27),
  );
  const [paymentAccountId, setPaymentAccountId] = useState(
    card?.paymentAccountId ?? "",
  );
  const [color, setColor] = useState(card?.color ?? "#A1A1AA");
  const [error, setError] = useState<string | null>(null);

  const availableAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.active || account.id === paymentAccountId,
      ),
    [accounts, paymentAccountId],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const limit = Number(creditLimit);
    const closing = Number(closingDay);
    const due = Number(dueDay);

    if (name.trim().length < 2) {
      setError("Informe um nome válido para o cartão.");
      return;
    }

    if (!/^\d{4}$/.test(lastFour)) {
      setError("Informe exatamente os quatro últimos dígitos.");
      return;
    }

    if (!Number.isFinite(limit) || limit <= 0) {
      setError("Informe um limite maior que zero.");
      return;
    }

    if (
      !Number.isInteger(closing) ||
      closing < 1 ||
      closing > 31 ||
      !Number.isInteger(due) ||
      due < 1 ||
      due > 31
    ) {
      setError("Os dias de fechamento e vencimento são inválidos.");
      return;
    }

    if (!paymentAccountId) {
      setError("Selecione a conta utilizada para pagar a fatura.");
      return;
    }

    const request: CreditCardFormRequest = {
      name: name.trim(),
      brand,
      lastFour,
      creditLimit: limit,
      closingDay: closing,
      dueDay: due,
      paymentAccountId,
      color: color || null,
    };

    try {
      await onSubmit(request);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível salvar o cartão.",
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
              {card ? "Editar cartão" : "Novo cartão"}
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
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="card-name" className={labelClassName}>
                Nome
              </label>
              <input
                id="card-name"
                value={name}
                autoFocus
                maxLength={120}
                disabled={submitting}
                placeholder="Ex.: Nubank"
                onChange={(event) => setName(event.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="card-brand" className={labelClassName}>
                Bandeira
              </label>
              <select
                id="card-brand"
                value={brand}
                disabled={submitting}
                onChange={(event) =>
                  setBrand(
                    event.target.value as FinancialCreditCardBrand,
                  )
                }
                className={inputClassName}
              >
                {brands.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="card-last-four"
                className={labelClassName}
              >
                Quatro últimos dígitos
              </label>
              <input
                id="card-last-four"
                value={lastFour}
                inputMode="numeric"
                maxLength={4}
                disabled={submitting}
                placeholder="0000"
                onChange={(event) =>
                  setLastFour(
                    event.target.value.replace(/\D/g, ""),
                  )
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="card-limit" className={labelClassName}>
                Limite
              </label>
              <input
                id="card-limit"
                type="number"
                min="0.01"
                step="0.01"
                value={creditLimit}
                disabled={submitting}
                onChange={(event) =>
                  setCreditLimit(event.target.value)
                }
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="card-closing-day"
                className={labelClassName}
              >
                Dia do fechamento
              </label>
              <input
                id="card-closing-day"
                type="number"
                min="1"
                max="31"
                value={closingDay}
                disabled={submitting}
                onChange={(event) =>
                  setClosingDay(event.target.value)
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="card-due-day" className={labelClassName}>
                Dia do vencimento
              </label>
              <input
                id="card-due-day"
                type="number"
                min="1"
                max="31"
                value={dueDay}
                disabled={submitting}
                onChange={(event) => setDueDay(event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="card-payment-account"
              className={labelClassName}
            >
              Conta de pagamento
            </label>
            <select
              id="card-payment-account"
              value={paymentAccountId}
              disabled={submitting}
              onChange={(event) =>
                setPaymentAccountId(event.target.value)
              }
              className={inputClassName}
            >
              <option value="">Selecione uma conta</option>
              {availableAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="card-color" className={labelClassName}>
              Cor
            </label>
            <div className="flex gap-3">
              <input
                id="card-color"
                type="color"
                value={color}
                disabled={submitting}
                onChange={(event) => setColor(event.target.value)}
                className="h-12 w-16 rounded-xl border border-white/10 bg-white/[0.04] p-2"
              />
              <input
                value={color}
                maxLength={7}
                disabled={submitting}
                onChange={(event) => setColor(event.target.value)}
                className={inputClassName}
              />
            </div>
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
              {card ? "Salvar alterações" : "Criar cartão"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}