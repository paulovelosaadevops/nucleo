"use client";

import { FormEvent, useMemo, useState } from "react";
import { LoaderCircle, X } from "lucide-react";

import type {
  CreateFinancialRecurrenceRequest,
  FinancialAccount,
  FinancialCategory,
  FinancialCreditCard,
  FinancialPaymentMethod,
  FinancialRecurrence,
  FinancialRecurrenceFrequency,
  FinancialTransactionType,
  UpdateFinancialRecurrenceRequest,
} from "@/types/finance";

type RecurrenceFormRequest =
  | CreateFinancialRecurrenceRequest
  | UpdateFinancialRecurrenceRequest;

interface FinancialRecurrenceFormProps {
  accounts: FinancialAccount[];
  categories: FinancialCategory[];
  creditCards: FinancialCreditCard[];
  recurrence?: FinancialRecurrence | null;
  submitting?: boolean;
  onSubmit: (request: RecurrenceFormRequest) => Promise<void>;
  onCancel: () => void;
}

interface FormState {
  accountId: string;
  creditCardId: string;
  categoryId: string;
  type: FinancialTransactionType;
  description: string;
  amount: string;
  frequency: FinancialRecurrenceFrequency;
  interval: string;
  startDate: string;
  endDate: string;
  occurrenceCount: string;
  paymentMethod: FinancialPaymentMethod | "";
  notes: string;
}

const frequencies: Array<{
  value: FinancialRecurrenceFrequency;
  label: string;
}> = [
  { value: "DAILY", label: "Diária" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "MONTHLY", label: "Mensal" },
  { value: "YEARLY", label: "Anual" },
];

const frequencyIntervalDetails: Record<
  FinancialRecurrenceFrequency,
  { label: string; help: string }
> = {
  DAILY: {
    label: "Intervalo em dias",
    help: "Use 1 para repetir todos os dias.",
  },
  WEEKLY: {
    label: "Intervalo em semanas",
    help: "Use 1 para repetir toda semana.",
  },
  MONTHLY: {
    label: "Intervalo em meses",
    help: "Use 1 para repetir todo mês.",
  },
  YEARLY: {
    label: "Intervalo em anos",
    help: "Use 1 para repetir todo ano.",
  },
};

const paymentMethods: Array<{
  value: FinancialPaymentMethod;
  label: string;
}> = [
  { value: "PIX", label: "Pix" },
  { value: "CASH", label: "Dinheiro" },
  { value: "DEBIT_CARD", label: "Cartão de débito" },
  { value: "BANK_TRANSFER", label: "Transferência bancária" },
  { value: "BANK_SLIP", label: "Boleto bancário" },
  { value: "DIRECT_DEBIT", label: "Débito automático" },
  { value: "CREDIT_CARD", label: "Cartão de crédito" },
  { value: "OTHER", label: "Outro" },
];

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

function createInitialState(
  recurrence?: FinancialRecurrence | null,
): FormState {
  if (recurrence) {
    return {
      accountId: recurrence.accountId ?? "",
      creditCardId: recurrence.creditCardId ?? "",
      categoryId: recurrence.categoryId ?? "",
      type: recurrence.type,
      description: recurrence.description,
      amount: String(recurrence.amount),
      frequency: recurrence.frequency,
      interval: String(recurrence.interval),
      startDate: recurrence.startDate,
      endDate: recurrence.endDate ?? "",
      occurrenceCount: "",
      paymentMethod: recurrence.paymentMethod ?? "",
      notes: recurrence.notes ?? "",
    };
  }

  return {
    accountId: "",
    creditCardId: "",
    categoryId: "",
    type: "EXPENSE",
    description: "",
    amount: "",
    frequency: "MONTHLY",
    interval: "1",
    startDate: todayAsInputValue(),
    endDate: "",
    occurrenceCount: "",
    paymentMethod: "",
    notes: "",
  };
}

export function FinancialRecurrenceForm({
  accounts,
  categories,
  creditCards,
  recurrence,
  submitting = false,
  onSubmit,
  onCancel,
}: FinancialRecurrenceFormProps) {
  const editing = Boolean(recurrence);

  const [form, setForm] = useState<FormState>(() =>
    createInitialState(recurrence),
  );

  const [error, setError] = useState<string | null>(null);

  const availableAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.active || account.id === form.accountId,
      ),
    [accounts, form.accountId],
  );

  const availableCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.type === form.type &&
          (category.active ||
            category.id === form.categoryId),
      ),
    [categories, form.categoryId, form.type],
  );

  const availableCreditCards = useMemo(
    () =>
      creditCards.filter(
        (creditCard) =>
          creditCard.active || creditCard.id === form.creditCardId,
      ),
    [creditCards, form.creditCardId],
  );

  const usesCreditCard =
    form.type === "EXPENSE" &&
    form.paymentMethod === "CREDIT_CARD";

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function changeType(type: FinancialTransactionType) {
    setForm((current) => {
      const selectedCategory = categories.find(
        (category) => category.id === current.categoryId,
      );

      return {
        ...current,
        type,
        paymentMethod:
          type === "INCOME" &&
          current.paymentMethod === "CREDIT_CARD"
            ? ""
            : current.paymentMethod,
        creditCardId: type === "INCOME" ? "" : current.creditCardId,
        categoryId:
          selectedCategory?.type === type
            ? current.categoryId
            : "",
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const amount = Number(form.amount);
    const interval = Number(form.interval);

    if (usesCreditCard && !form.creditCardId) {
      setError("Selecione um cartão de crédito.");
      return;
    }

    if (!usesCreditCard && !form.accountId) {
      setError("Selecione uma conta.");
      return;
    }

    if (form.description.trim().length < 2) {
      setError("Informe uma descrição válida.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }

    const commonRequest = {
      accountId: usesCreditCard ? null : form.accountId,
      creditCardId: usesCreditCard ? form.creditCardId : null,
      categoryId: form.categoryId || null,
      type: form.type,
      description: form.description.trim(),
      amount,
      paymentMethod: form.paymentMethod || null,
      notes: form.notes.trim() || null,
    };

    try {
      if (editing) {
        const request: UpdateFinancialRecurrenceRequest =
          commonRequest;

        await onSubmit(request);
        return;
      }

      if (
        !Number.isInteger(interval) ||
        interval < 1 ||
        interval > 365
      ) {
        setError("O intervalo deve ficar entre 1 e 365.");
        return;
      }

      if (!form.startDate) {
        setError("Informe a data inicial.");
        return;
      }

      if (
        form.endDate &&
        form.endDate < form.startDate
      ) {
        setError(
          "A data final não pode ser anterior à data inicial.",
        );
        return;
      }

      const parsedOccurrenceCount = form.occurrenceCount
        ? Number(form.occurrenceCount)
        : null;

      if (
        parsedOccurrenceCount !== null &&
        (!Number.isInteger(parsedOccurrenceCount) ||
          parsedOccurrenceCount < 1)
      ) {
        setError(
          "A quantidade de ocorrências deve ser maior que zero.",
        );
        return;
      }

      const request: CreateFinancialRecurrenceRequest = {
        ...commonRequest,
        frequency: form.frequency,
        interval,
        startDate: form.startDate,
        endDate: form.endDate || null,
        occurrenceCount: parsedOccurrenceCount,
      };

      await onSubmit(request);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível salvar a recorrência.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6">
      <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#090909] sm:max-w-2xl sm:rounded-[2rem]">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-white/10 bg-[#090909]/95 p-5 backdrop-blur-xl sm:px-7">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Planejamento
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              {editing
                ? "Editar recorrência"
                : "Nova recorrência"}
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

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-5 sm:p-7"
        >
          <fieldset disabled={submitting}>
            <legend className="sr-only">
              Tipo da recorrência
            </legend>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.025] p-1.5">
              <button
                type="button"
                onClick={() => changeType("EXPENSE")}
                className={[
                  "h-11 rounded-xl text-sm font-semibold transition",
                  form.type === "EXPENSE"
                    ? "bg-white text-black"
                    : "text-zinc-500 hover:bg-white/[0.05] hover:text-white",
                ].join(" ")}
              >
                Despesa
              </button>

              <button
                type="button"
                onClick={() => changeType("INCOME")}
                className={[
                  "h-11 rounded-xl text-sm font-semibold transition",
                  form.type === "INCOME"
                    ? "bg-white text-black"
                    : "text-zinc-500 hover:bg-white/[0.05] hover:text-white",
                ].join(" ")}
              >
                Receita
              </button>
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="recurrence-description"
              className={labelClassName}
            >
              Descrição
            </label>

            <input
              id="recurrence-description"
              value={form.description}
              maxLength={160}
              autoFocus
              disabled={submitting}
              placeholder="Ex.: Financiamento do apartamento"
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              className={inputClassName}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="recurrence-amount"
                className={labelClassName}
              >
                Valor
              </label>

              <input
                id="recurrence-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                disabled={submitting}
                placeholder="0,00"
                onChange={(event) =>
                  updateField("amount", event.target.value)
                }
                className={inputClassName}
              />

              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Valor de referencia. O valor real sera solicitado mensalmente
                antes de entrar na conta ou fatura.
              </p>
            </div>

            <div>
              <label
                htmlFor="recurrence-payment"
                className={labelClassName}
              >
                Forma de pagamento
              </label>

              <select
                id="recurrence-payment"
                value={form.paymentMethod}
                disabled={submitting}
                onChange={(event) => {
                  const value = event.target
                    .value as FinancialPaymentMethod | "";

                  setForm((current) => ({
                    ...current,
                    paymentMethod: value,
                    accountId:
                      value === "CREDIT_CARD" ? "" : current.accountId,
                    creditCardId:
                      value === "CREDIT_CARD"
                        ? current.creditCardId
                        : "",
                  }));
                }}
                className={inputClassName}
              >
                <option value="">Não informada</option>

                {paymentMethods
                  .filter(
                    (method) =>
                      form.type === "EXPENSE" ||
                      method.value !== "CREDIT_CARD",
                  )
                  .map((method) => (
                  <option
                    key={method.value}
                    value={method.value}
                  >
                    {method.label}
                  </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor={
                  usesCreditCard
                    ? "recurrence-credit-card"
                    : "recurrence-account"
                }
                className={labelClassName}
              >
                {usesCreditCard ? "Cartão de crédito" : "Conta"}
              </label>

              {usesCreditCard ? (
                <select
                  id="recurrence-credit-card"
                  value={form.creditCardId}
                  disabled={submitting}
                  onChange={(event) =>
                    updateField("creditCardId", event.target.value)
                  }
                  className={inputClassName}
                >
                  <option value="">Selecione um cartão</option>

                  {availableCreditCards.map((creditCard) => (
                    <option key={creditCard.id} value={creditCard.id}>
                      {creditCard.name} •••• {creditCard.lastFour}
                      {!creditCard.active ? " — Inativo" : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  id="recurrence-account"
                  value={form.accountId}
                  disabled={submitting}
                  onChange={(event) =>
                    updateField("accountId", event.target.value)
                  }
                  className={inputClassName}
                >
                  <option value="">Selecione uma conta</option>

                  {availableAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                      {!account.active ? " — Inativa" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label
                htmlFor="recurrence-category"
                className={labelClassName}
              >
                Categoria
              </label>

              <select
                id="recurrence-category"
                value={form.categoryId}
                disabled={submitting}
                onChange={(event) =>
                  updateField("categoryId", event.target.value)
                }
                className={inputClassName}
              >
                <option value="">Sem categoria</option>

                {availableCategories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!editing ? (
            <section className="space-y-5 rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4">
              <div>
                <p className="text-sm font-semibold text-white">
                  Repetição
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Defina quando as pendencias de confirmacao serao criadas.
                  Nada entra na fatura antes da confirmacao do valor real.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="recurrence-frequency"
                    className={labelClassName}
                  >
                    Frequência
                  </label>

                  <select
                    id="recurrence-frequency"
                    value={form.frequency}
                    disabled={submitting}
                    onChange={(event) =>
                      updateField(
                        "frequency",
                        event.target
                          .value as FinancialRecurrenceFrequency,
                      )
                    }
                    className={inputClassName}
                  >
                    {frequencies.map((frequency) => (
                      <option
                        key={frequency.value}
                        value={frequency.value}
                      >
                        {frequency.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="recurrence-interval"
                    className={labelClassName}
                  >
                    {frequencyIntervalDetails[form.frequency].label}
                  </label>

                  <input
                    id="recurrence-interval"
                    type="number"
                    min="1"
                    max="365"
                    step="1"
                    value={form.interval}
                    disabled={submitting}
                    onChange={(event) =>
                      updateField("interval", event.target.value)
                    }
                    className={inputClassName}
                  />

                  <p className="mt-2 text-xs text-zinc-600">
                    {frequencyIntervalDetails[form.frequency].help}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="recurrence-start"
                    className={labelClassName}
                  >
                    Data inicial
                  </label>

                  <input
                    id="recurrence-start"
                    type="date"
                    value={form.startDate}
                    disabled={submitting}
                    onChange={(event) =>
                      updateField(
                        "startDate",
                        event.target.value,
                      )
                    }
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="recurrence-end"
                    className={labelClassName}
                  >
                    Data final opcional
                  </label>

                  <input
                    id="recurrence-end"
                    type="date"
                    min={form.startDate}
                    value={form.endDate}
                    disabled={submitting}
                    onChange={(event) =>
                      updateField("endDate", event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="recurrence-count"
                  className={labelClassName}
                >
                  Limite de ocorrências
                </label>

                <input
                  id="recurrence-count"
                  type="number"
                  min="1"
                  step="1"
                  value={form.occurrenceCount}
                  disabled={submitting}
                  placeholder="Sem limite"
                  onChange={(event) =>
                    updateField(
                      "occurrenceCount",
                      event.target.value,
                    )
                  }
                  className={inputClassName}
                />
              </div>
            </section>
          ) : (
            <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4">
              <p className="text-sm font-semibold text-white">
                Regra de repetição
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                {frequencies.find(
                  (item) => item.value === recurrence?.frequency,
                )?.label ?? recurrence?.frequency}
                , a cada {recurrence?.interval}.
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                A regra temporal não pode ser alterada depois da
                criação.
              </p>
            </section>
          )}

          <div>
            <label
              htmlFor="recurrence-notes"
              className={labelClassName}
            >
              Observações
            </label>

            <textarea
              id="recurrence-notes"
              value={form.notes}
              maxLength={1000}
              rows={4}
              disabled={submitting}
              placeholder="Informações adicionais"
              onChange={(event) =>
                updateField("notes", event.target.value)
              }
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-white/25 disabled:opacity-50"
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

              {editing
                ? "Salvar alterações"
                : "Criar recorrência"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
