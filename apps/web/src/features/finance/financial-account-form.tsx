"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, X } from "lucide-react";

import type {
  CreateFinancialAccountRequest,
  FinancialAccount,
  FinancialAccountType,
  UpdateFinancialAccountRequest,
} from "@/types/finance";

type AccountFormRequest =
  | CreateFinancialAccountRequest
  | UpdateFinancialAccountRequest;

interface FinancialAccountFormProps {
  account?: FinancialAccount | null;
  submitting?: boolean;
  onSubmit: (request: AccountFormRequest) => Promise<void>;
  onCancel: () => void;
}

const availableAccountTypes: Array<{
  value: FinancialAccountType;
  label: string;
}> = [
  { value: "CHECKING", label: "Conta corrente" },
  { value: "SAVINGS", label: "Poupança" },
  { value: "CASH", label: "Dinheiro" },
  { value: "DIGITAL_WALLET", label: "Carteira digital" },
  { value: "OTHER", label: "Outra" },
];

const inputClassName =
  "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-white/25";

const labelClassName =
  "mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500";

export function FinancialAccountForm({
  account,
  submitting = false,
  onSubmit,
  onCancel,
}: FinancialAccountFormProps) {
  const editing = Boolean(account);

  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<FinancialAccountType>(
    account?.type ?? "CHECKING",
  );

  const [initialBalance, setInitialBalance] = useState(
    String(account?.initialBalance ?? 0),
  );

  const [color, setColor] = useState(
    account?.color ?? "#A1A1AA",
  );

  const [includeInTotal, setIncludeInTotal] = useState(
    account?.includeInTotal ?? true,
  );

  const [error, setError] = useState<string | null>(null);
  const accountTypes =
    account?.type === "INVESTMENT"
      ? [
          ...availableAccountTypes,
          { value: "INVESTMENT" as const, label: "Investimento legado" },
        ]
      : availableAccountTypes;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedName = name.trim();

    if (normalizedName.length < 2) {
      setError("Informe um nome válido para a conta.");
      return;
    }

    try {
      if (editing) {
        const request: UpdateFinancialAccountRequest = {
          name: normalizedName,
          type,
          color: color || null,
          includeInTotal,
        };

        await onSubmit(request);
        return;
      }

      const numericBalance = Number(initialBalance);

      if (!Number.isFinite(numericBalance)) {
        setError("Informe um saldo inicial válido.");
        return;
      }

      const request: CreateFinancialAccountRequest = {
        name: normalizedName,
        type,
        initialBalance: numericBalance,
        color: color || null,
        includeInTotal,
      };

      await onSubmit(request);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível salvar a conta.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6">
      <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#090909] sm:max-w-xl sm:rounded-[2rem]">
        <header className="flex items-start justify-between border-b border-white/10 p-5 sm:px-7">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Finanças
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {editing ? "Editar conta" : "Nova conta"}
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
          <div>
            <label htmlFor="account-name" className={labelClassName}>
              Nome
            </label>
            <input
              id="account-name"
              value={name}
              maxLength={120}
              autoFocus
              disabled={submitting}
              placeholder="Ex.: Conta principal"
              onChange={(event) => setName(event.target.value)}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="account-type" className={labelClassName}>
              Tipo
            </label>
            <select
              id="account-type"
              value={type}
              disabled={submitting}
              onChange={(event) => {
                const nextType = event.target.value as FinancialAccountType;
                setType(nextType);
                if (nextType === "INVESTMENT") {
                  setIncludeInTotal(false);
                }
              }}
              className={inputClassName}
            >
              {accountTypes.map((accountType) => (
                <option
                  key={accountType.value}
                  value={accountType.value}
                >
                  {accountType.label}
                </option>
              ))}
            </select>
          </div>

          {!editing ? (
            <div>
              <label
                htmlFor="account-initial-balance"
                className={labelClassName}
              >
                Saldo inicial
              </label>
              <input
                id="account-initial-balance"
                type="number"
                step="0.01"
                value={initialBalance}
                disabled={submitting}
                onChange={(event) =>
                  setInitialBalance(event.target.value)
                }
                className={inputClassName}
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="account-color" className={labelClassName}>
              Cor de identificação
            </label>

            <div className="flex gap-3">
              <input
                id="account-color"
                type="color"
                value={color}
                disabled={submitting}
                onChange={(event) => setColor(event.target.value)}
                className="h-12 w-16 rounded-xl border border-white/10 bg-white/[0.04] p-2"
              />

              <input
                value={color}
                disabled={submitting}
                maxLength={7}
                onChange={(event) => setColor(event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div>
              <p className="text-sm font-medium text-white">
                Incluir no saldo total
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Considerar esta conta nos indicadores gerais.
              </p>
            </div>

            <input
              type="checkbox"
              checked={includeInTotal}
              disabled={submitting || type === "INVESTMENT"}
              onChange={(event) =>
                setIncludeInTotal(event.target.checked)
              }
              className="size-5 accent-white"
            />
          </label>

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

              {editing ? "Salvar alterações" : "Criar conta"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
