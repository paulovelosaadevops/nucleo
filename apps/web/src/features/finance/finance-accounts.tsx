"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Landmark,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Trash2,
  Wallet,
} from "lucide-react";

import { financeService } from "./finance-service";
import {
  FinanceCell,
  FinanceCompactList,
  FinanceCompactRow,
  FinanceStatusPill,
} from "./finance-compact-list";
import { FinancialAccountForm } from "./financial-account-form";

import type {
  CreateFinancialAccountRequest,
  FinancialAccount,
  UpdateFinancialAccountRequest,
} from "@/types/finance";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const accountTypeLabels: Record<
  FinancialAccount["type"],
  string
> = {
  CASH: "Dinheiro",
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  INVESTMENT: "Investimento",
  DIGITAL_WALLET: "Carteira digital",
  OTHER: "Outra",
};

export function FinanceAccounts() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [editing, setEditing] =
    useState<FinancialAccount | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalBalance = useMemo(
    () =>
      accounts
        .filter(
          (account) =>
            account.active && account.includeInTotal,
        )
        .reduce(
          (total, account) => total + account.currentBalance,
          0,
        ),
    [accounts],
  );

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setAccounts(await financeService.accounts.list());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar as contas.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  async function handleSubmit(
    request:
      | CreateFinancialAccountRequest
      | UpdateFinancialAccountRequest,
  ) {
    setSubmitting(true);

    try {
      if (editing) {
        await financeService.accounts.update(
          editing.id,
          request as UpdateFinancialAccountRequest,
        );
      } else {
        await financeService.accounts.create(
          request as CreateFinancialAccountRequest,
        );
      }

      setFormOpen(false);
      setEditing(null);
      await loadAccounts();
    } finally {
      setSubmitting(false);
    }
  }

  async function executeAction(
    accountId: string,
    action: () => Promise<FinancialAccount | void>,
  ) {
    setActionId(accountId);
    setError(null);

    try {
      await action();
      await loadAccounts();
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

  function changeInitialBalance(account: FinancialAccount) {
    const value = window.prompt(
      `Novo saldo inicial para "${account.name}":`,
      String(account.initialBalance),
    );

    if (value === null) {
      return;
    }

    const initialBalance = Number(
      value.replace(",", "."),
    );

    if (!Number.isFinite(initialBalance)) {
      setError("Informe um saldo inicial válido.");
      return;
    }

    void executeAction(account.id, () =>
      financeService.accounts.changeInitialBalance(account.id, {
        initialBalance,
      }),
    );
  }

  function removeAccount(account: FinancialAccount) {
    const confirmed = window.confirm(
      `Deseja excluir a conta "${account.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    void executeAction(account.id, () =>
      financeService.accounts.remove(account.id),
    );
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />

        <div className="relative flex items-start justify-between gap-5">
          <div>
            <p className="text-sm text-zinc-500">
              Saldo consolidado
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {currencyFormatter.format(totalBalance)}
            </p>
            <p className="mt-2 text-xs text-zinc-600">
              Apenas contas ativas incluídas no total
            </p>
          </div>

          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-white">
            <Wallet className="size-5" />
          </div>
        </div>
      </section>

      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-semibold text-white">
            Contas financeiras
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {accounts.length} cadastradas
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-black"
        >
          <Plus className="size-4" />
          Nova conta
        </button>
      </div>

      {error ? (
        <div className="flex gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-4 text-sm text-rose-200">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-60 items-center justify-center rounded-[1.75rem] border border-white/10">
          <LoaderCircle className="size-6 animate-spin text-zinc-500" />
        </div>
      ) : null}

      {!loading && accounts.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 text-center">
          <Landmark className="size-8 text-zinc-600" />
          <p className="mt-4 font-medium text-zinc-300">
            Nenhuma conta cadastrada
          </p>
        </div>
      ) : null}

      {!loading && accounts.length > 0 ? (
        <FinanceCompactList
          columns={[
            "Conta",
            "Tipo",
            "Saldo atual",
            "Saldo inicial",
            "Consolidado",
            "Situação",
            "Ações",
          ]}
          gridClassName="lg:grid-cols-[minmax(12rem,1.4fr)_minmax(8rem,1fr)_9rem_9rem_9rem_7rem_11rem]"
        >
          {accounts.map((account) => {
            const processing = actionId === account.id;
            const participation =
              totalBalance === 0 || !account.includeInTotal
                ? 0
                : (account.currentBalance / totalBalance) * 100;

            return (
              <FinanceCompactRow
                key={account.id}
                gridClassName="lg:grid-cols-[minmax(12rem,1.4fr)_minmax(8rem,1fr)_9rem_9rem_9rem_7rem_11rem]"
                className={
                  account.active
                    ? undefined
                    : "bg-white/[0.012] opacity-70"
                }
              >
                <FinanceCell>
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="size-2.5 shrink-0 rounded-full border border-white/20"
                      style={{ backgroundColor: account.color ?? undefined }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {account.name}
                      </p>
                      {!account.includeInTotal ? (
                        <p className="mt-1 text-xs text-zinc-600">
                          Fora do saldo consolidado
                        </p>
                      ) : null}
                    </div>
                  </div>
                </FinanceCell>

                <FinanceCell className="mt-2 text-xs text-zinc-500 lg:mt-0 lg:text-sm lg:text-zinc-400">
                  {accountTypeLabels[account.type]}
                </FinanceCell>

                <FinanceCell className="mt-2 text-sm font-semibold text-white tabular-nums lg:mt-0 lg:text-right">
                  {currencyFormatter.format(account.currentBalance)}
                </FinanceCell>

                <FinanceCell className="mt-1 text-xs text-zinc-500 tabular-nums lg:mt-0 lg:text-right lg:text-sm lg:text-zinc-400">
                  {currencyFormatter.format(account.initialBalance)}
                </FinanceCell>

                <FinanceCell className="mt-2 text-xs text-zinc-500 lg:mt-0 lg:text-right lg:text-sm lg:text-zinc-400">
                  {account.includeInTotal
                    ? `${participation.toLocaleString("pt-BR", {
                        maximumFractionDigits: 1,
                      })}%`
                    : "Não participa"}
                </FinanceCell>

                <FinanceCell className="mt-2 lg:mt-0">
                  <FinanceStatusPill tone={account.active ? "positive" : "muted"}>
                    {account.active ? "Ativa" : "Inativa"}
                  </FinanceStatusPill>
                </FinanceCell>

                <FinanceCell className="mt-3 lg:mt-0">
                  {processing ? (
                    <div className="flex size-9 items-center justify-end">
                      <LoaderCircle className="size-4 animate-spin text-zinc-500" />
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-end gap-1">
                      <button
                        type="button"
                        title="Ajustar saldo inicial"
                        aria-label="Ajustar saldo inicial"
                        onClick={() => changeInitialBalance(account)}
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"
                      >
                        <RefreshCw className="size-4" />
                      </button>

                      <button
                        type="button"
                        title="Editar"
                        aria-label="Editar conta"
                        onClick={() => {
                          setEditing(account);
                          setFormOpen(true);
                        }}
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="size-4" />
                      </button>

                      <button
                        type="button"
                        title={account.active ? "Desativar" : "Ativar"}
                        aria-label={account.active ? "Desativar conta" : "Ativar conta"}
                        onClick={() =>
                          void executeAction(account.id, () =>
                            account.active
                              ? financeService.accounts.deactivate(account.id)
                              : financeService.accounts.activate(account.id),
                          )
                        }
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"
                      >
                        <Power className="size-4" />
                      </button>

                      <button
                        type="button"
                        title="Excluir"
                        aria-label="Excluir conta"
                        onClick={() => removeAccount(account)}
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-rose-400/10 hover:text-rose-300"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )}
                </FinanceCell>
              </FinanceCompactRow>
            );
          })}
        </FinanceCompactList>
      ) : null}
      {formOpen ? (
        <FinancialAccountForm
          key={editing?.id ?? "new-account"}
          account={editing}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => {
            if (!submitting) {
              setFormOpen(false);
              setEditing(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
