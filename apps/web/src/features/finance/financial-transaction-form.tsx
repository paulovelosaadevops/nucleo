"use client";

import { ModalShell } from "@/components/ui/modal-shell";

import type {
  CreateFinancialTransactionRequest,
  FinancialAccount,
  FinancialCategory,
  FinancialPaymentMethod,
  FinancialTransaction,
  FinancialTransactionStatus,
  FinancialTransactionType,
  UpdateFinancialTransactionRequest,
} from "@/types/finance";

import { LoaderCircle } from "lucide-react";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

type TransactionFormData =
  | CreateFinancialTransactionRequest
  | UpdateFinancialTransactionRequest;

interface FinancialTransactionFormProps {
  accounts: FinancialAccount[];
  categories: FinancialCategory[];
  transaction?: FinancialTransaction | null;
  submitting?: boolean;
  onSubmit: (
    request: TransactionFormData,
  ) => Promise<void>;
  onCancel: () => void;
}

interface FormState {
  accountId: string;
  categoryId: string;
  type: FinancialTransactionType;
  description: string;
  amount: string;
  transactionDate: string;
  dueDate: string;
  status: FinancialTransactionStatus;
  paymentMethod:
    | FinancialPaymentMethod
    | "";
  notes: string;
}

const paymentMethods: Array<{
  value: FinancialPaymentMethod;
  label: string;
}> = [
  {
    value: "PIX",
    label: "Pix",
  },
  {
    value: "CASH",
    label: "Dinheiro",
  },
  {
    value: "DEBIT_CARD",
    label: "Cartão de débito",
  },
  {
    value: "BANK_TRANSFER",
    label: "Transferência bancária",
  },
  {
    value: "BANK_SLIP",
    label: "Boleto bancário",
  },
  {
    value: "DIRECT_DEBIT",
    label: "Débito automático",
  },
  {
    value: "OTHER",
    label: "Outro",
  },
];

const inputClassName = [
  "h-12 w-full rounded-2xl border border-white/10",
  "bg-white/[0.04] px-4 text-sm text-white outline-none",
  "transition placeholder:text-zinc-600",
  "focus:border-white/25 focus:bg-white/[0.065]",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

const labelClassName =
  "mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-zinc-500";

function todayAsInputValue() {
  const today = new Date();

  const year =
    today.getFullYear();

  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createInitialState(
  transaction?:
    | FinancialTransaction
    | null,
): FormState {
  if (transaction) {
    return {
      accountId:
        transaction.accountId,
      categoryId:
        transaction.categoryId ?? "",
      type:
        transaction.type,
      description:
        transaction.description,
      amount:
        String(transaction.amount),
      transactionDate:
        transaction.transactionDate,
      dueDate:
        transaction.dueDate ?? "",
      status:
        transaction.status,
      paymentMethod:
        transaction.paymentMethod ?? "",
      notes:
        transaction.notes ?? "",
    };
  }

  return {
    accountId: "",
    categoryId: "",
    type: "EXPENSE",
    description: "",
    amount: "",
    transactionDate:
      todayAsInputValue(),
    dueDate: "",
    status: "PENDING",
    paymentMethod: "",
    notes: "",
  };
}

export function FinancialTransactionForm({
  accounts,
  categories,
  transaction,
  submitting = false,
  onSubmit,
  onCancel,
}: FinancialTransactionFormProps) {
  const editing =
    Boolean(transaction);

  const [form, setForm] =
    useState<FormState>(() =>
      createInitialState(
        transaction,
      ),
    );

  const [error, setError] =
    useState<string | null>(null);

  const availableAccounts =
    useMemo(
      () =>
        accounts.filter(
          (account) =>
            account.active ||
            account.id ===
              form.accountId,
        ),
      [
        accounts,
        form.accountId,
      ],
    );

  const availableCategories =
    useMemo(
      () =>
        categories.filter(
          (category) =>
            category.type ===
              form.type &&
            (
              category.active ||
              category.id ===
                form.categoryId
            ),
        ),
      [
        categories,
        form.categoryId,
        form.type,
      ],
    );

  function updateField<
    K extends keyof FormState,
  >(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function changeType(
    type: FinancialTransactionType,
  ) {
    setForm((current) => {
      const currentCategory =
        categories.find(
          (category) =>
            category.id ===
            current.categoryId,
        );

      return {
        ...current,
        type,
        categoryId:
          currentCategory?.type === type
            ? current.categoryId
            : "",
      };
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);

    const description =
      form.description.trim();

    const amount =
      Number(form.amount);

    if (!form.accountId) {
      setError(
        "Selecione uma conta.",
      );
      return;
    }

    if (description.length < 2) {
      setError(
        "A descrição deve possuir pelo menos 2 caracteres.",
      );
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Informe um valor maior que zero.",
      );
      return;
    }

    if (!form.transactionDate) {
      setError(
        "Informe a data do lançamento.",
      );
      return;
    }

    const commonRequest = {
      accountId:
        form.accountId,
      categoryId:
        form.categoryId || null,
      type:
        form.type,
      description,
      amount,
      transactionDate:
        form.transactionDate,
      dueDate:
        form.dueDate || null,
      paymentMethod:
        form.paymentMethod || null,
      notes:
        form.notes.trim() || null,
    };

    try {
      if (editing) {
        const updateRequest:
          UpdateFinancialTransactionRequest =
            commonRequest;

        await onSubmit(
          updateRequest,
        );

        return;
      }

      const createRequest:
        CreateFinancialTransactionRequest = {
          ...commonRequest,
          status: form.status,
        };

      await onSubmit(
        createRequest,
      );
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível salvar o lançamento.",
      );
    }
  }

  return (
    <ModalShell
      eyebrow="Finanças"
      title={
        editing
          ? "Editar lançamento"
          : "Novo lançamento"
      }
      titleId="transaction-form-title"
      busy={submitting}
      onClose={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        className="
          flex
          min-h-0
          flex-1
          flex-col
        "
      >
        <div
          className="
            min-h-0
            flex-1
            space-y-6
            overflow-y-auto
            overscroll-contain
            p-5
            sm:p-7
          "
        >
          <fieldset disabled={submitting}>
            <legend className="sr-only">
              Tipo do lançamento
            </legend>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.025] p-1.5">
              <button
                type="button"
                onClick={() =>
                  changeType("EXPENSE")
                }
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
                onClick={() =>
                  changeType("INCOME")
                }
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
              htmlFor="transaction-description"
              className={labelClassName}
            >
              Descrição
            </label>

            <input
              id="transaction-description"
              type="text"
              value={form.description}
              disabled={submitting}
              maxLength={160}
              autoFocus
              placeholder={
                form.type === "EXPENSE"
                  ? "Ex.: Supermercado"
                  : "Ex.: Salário"
              }
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value,
                )
              }
              className={inputClassName}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="transaction-amount"
                className={labelClassName}
              >
                Valor
              </label>

              <input
                id="transaction-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={form.amount}
                disabled={submitting}
                placeholder="0,00"
                onChange={(event) =>
                  updateField(
                    "amount",
                    event.target.value,
                  )
                }
                className={inputClassName}
              />
            </div>

            {!editing ? (
              <div>
                <label
                  htmlFor="transaction-status"
                  className={labelClassName}
                >
                  Situação inicial
                </label>

                <select
                  id="transaction-status"
                  value={form.status}
                  disabled={submitting}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target
                        .value as FinancialTransactionStatus,
                    )
                  }
                  className={inputClassName}
                >
                  <option value="PENDING">
                    Pendente
                  </option>

                  <option value="PAID">
                    Pago
                  </option>
                </select>
              </div>
            ) : (
              <div>
                <span className={labelClassName}>
                  Situação atual
                </span>

                <div className="flex h-12 items-center rounded-2xl border border-white/10 bg-white/[0.025] px-4 text-sm text-zinc-400">
                  {form.status === "PAID"
                    ? "Pago"
                    : form.status ===
                        "PENDING"
                      ? "Pendente"
                      : "Cancelado"}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="transaction-account"
                className={labelClassName}
              >
                Conta
              </label>

              <select
                id="transaction-account"
                value={form.accountId}
                disabled={submitting}
                onChange={(event) =>
                  updateField(
                    "accountId",
                    event.target.value,
                  )
                }
                className={inputClassName}
              >
                <option value="">
                  Selecione uma conta
                </option>

                {availableAccounts.map(
                  (account) => (
                    <option
                      key={account.id}
                      value={account.id}
                    >
                      {account.name}
                      {!account.active
                        ? " — Inativa"
                        : ""}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="transaction-category"
                className={labelClassName}
              >
                Categoria
              </label>

              <select
                id="transaction-category"
                value={form.categoryId}
                disabled={submitting}
                onChange={(event) =>
                  updateField(
                    "categoryId",
                    event.target.value,
                  )
                }
                className={inputClassName}
              >
                <option value="">
                  Sem categoria
                </option>

                {availableCategories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                      {!category.active
                        ? " — Inativa"
                        : ""}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="transaction-date"
                className={labelClassName}
              >
                Data do lançamento
              </label>

              <input
                id="transaction-date"
                type="date"
                value={
                  form.transactionDate
                }
                disabled={submitting}
                onChange={(event) =>
                  updateField(
                    "transactionDate",
                    event.target.value,
                  )
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="transaction-due-date"
                className={labelClassName}
              >
                Data de vencimento
              </label>

              <input
                id="transaction-due-date"
                type="date"
                value={form.dueDate}
                disabled={submitting}
                onChange={(event) =>
                  updateField(
                    "dueDate",
                    event.target.value,
                  )
                }
                className={inputClassName}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="transaction-payment-method"
              className={labelClassName}
            >
              Forma de pagamento
            </label>

            <select
              id="transaction-payment-method"
              value={form.paymentMethod}
              disabled={submitting}
              onChange={(event) =>
                updateField(
                  "paymentMethod",
                  event.target
                    .value as
                    | FinancialPaymentMethod
                    | "",
                )
              }
              className={inputClassName}
            >
              <option value="">
                Não informada
              </option>

              {paymentMethods.map(
                (method) => (
                  <option
                    key={method.value}
                    value={method.value}
                  >
                    {method.label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="transaction-notes"
              className={labelClassName}
            >
              Observações
            </label>

            <textarea
              id="transaction-notes"
              value={form.notes}
              disabled={submitting}
              maxLength={1000}
              rows={4}
              placeholder="Informações adicionais sobre o lançamento"
              onChange={(event) =>
                updateField(
                  "notes",
                  event.target.value,
                )
              }
              className="
                w-full
                resize-none
                rounded-2xl
                border
                border-white/10
                bg-white/[0.04]
                px-4
                py-3
                text-sm
                leading-6
                text-white
                outline-none
                transition
                placeholder:text-zinc-600
                focus:border-white/25
                focus:bg-white/[0.065]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm leading-6 text-rose-200"
            >
              {error}
            </div>
          ) : null}
        </div>

        <footer
          className="
            flex
            shrink-0
            flex-col-reverse
            gap-2
            border-t
            border-white/10
            bg-[#090909]/95
            p-5
            backdrop-blur-xl
            sm:flex-row
            sm:justify-end
            sm:px-7
          "
        >
          <button
            type="button"
            disabled={submitting}
            onClick={onCancel}
            className="
              h-11
              rounded-2xl
              border
              border-white/10
              px-5
              text-sm
              font-semibold
              text-zinc-300
              transition
              hover:bg-white/[0.06]
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="
              inline-flex
              h-11
              items-center
              justify-center
              gap-2
              rounded-2xl
              bg-white
              px-6
              text-sm
              font-semibold
              text-black
              transition
              hover:bg-zinc-200
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {submitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : null}

            {editing
              ? "Salvar alterações"
              : "Criar lançamento"}
          </button>
        </footer>
      </form>
    </ModalShell>
  );
}