"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CircleX,
  Filter,
  LoaderCircle,
  Pencil,
  Plus,
  ReceiptText,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { financeService } from "./finance-service";
import {
  FinanceCell,
  FinanceCompactList,
  FinanceCompactRow,
  FinanceStatusPill,
} from "./finance-compact-list";
import { FinancialTransactionForm } from "./financial-transaction-form";

import type {
  CreateFinancialTransactionRequest,
  FinancialAccount,
  FinancialCategory,
  FinancialTransaction,
  FinancialTransactionFilters,
  FinancialTransactionStatus,
  FinancialTransactionType,
  UpdateFinancialTransactionRequest,
} from "@/types/finance";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const inputClassName =
  "h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition focus:border-white/25";

function formatDate(value: string | null) {
  if (!value) {
    return "Sem vencimento";
  }

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${value}T00:00:00`),
  );
}

function currentMonthPeriod() {
  const today = new Date();

  const firstDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  );

  const lastDay = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  );

  function format(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return {
    from: format(firstDay),
    to: format(lastDay),
  };
}

function statusLabel(status: FinancialTransactionStatus) {
  const labels: Record<FinancialTransactionStatus, string> = {
    PENDING: "Pendente",
    PAID: "Pago",
    CANCELLED: "Cancelado",
  };

  return labels[status];
}

export function FinanceTransactions() {
  const initialPeriod = useMemo(() => currentMonthPeriod(), []);

  const [transactions, setTransactions] = useState<
    FinancialTransaction[]
  >([]);

  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<
    FinancialCategory[]
  >([]);

  const [filters, setFilters] =
    useState<FinancialTransactionFilters>({
      from: initialPeriod.from,
      to: initialPeriod.to,
    });

  const [editing, setEditing] =
    useState<FinancialTransaction | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReferences = useCallback(async () => {
    const [accountResult, categoryResult] = await Promise.all([
      financeService.accounts.list(),
      financeService.categories.list(),
    ]);

    setAccounts(accountResult);
    setCategories(categoryResult);
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await financeService.transactions.list(filters);

      setTransactions(response);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar os lançamentos.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadReferences().catch((requestError) => {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar contas e categorias.",
      );
    });
  }, [loadReferences]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);

    if (query.get("novo") === "true") {
      setEditing(null);
      setFormOpen(true);
    }
  }, []);

  const totals = useMemo(() => {
    return transactions.reduce(
      (result, transaction) => {
        if (transaction.status === "CANCELLED") {
          return result;
        }

        if (transaction.type === "INCOME") {
          result.income += transaction.amount;
        } else {
          result.expense += transaction.amount;
        }

        return result;
      },
      {
        income: 0,
        expense: 0,
      },
    );
  }, [transactions]);

  function openCreateForm() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEditForm(transaction: FinancialTransaction) {
    setEditing(transaction);
    setFormOpen(true);
  }

  function closeForm() {
    if (submitting) {
      return;
    }

    setFormOpen(false);
    setEditing(null);
  }

  async function handleSubmit(
    request:
      | CreateFinancialTransactionRequest
      | UpdateFinancialTransactionRequest,
  ) {
    setSubmitting(true);

    try {
      if (editing) {
        await financeService.transactions.update(
          editing.id,
          request as UpdateFinancialTransactionRequest,
        );
      } else {
        await financeService.transactions.create(
          request as CreateFinancialTransactionRequest,
        );
      }

      closeForm();
      await loadTransactions();
    } finally {
      setSubmitting(false);
    }
  }

  async function executeAction(
    transactionId: string,
    action: () => Promise<FinancialTransaction | void>,
  ) {
    setActionId(transactionId);
    setError(null);

    try {
      await action();
      await loadTransactions();
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

  function removeTransaction(transaction: FinancialTransaction) {
    const confirmed = window.confirm(
      `Deseja excluir o lançamento "${transaction.description}"?`,
    );

    if (!confirmed) {
      return;
    }

    void executeAction(transaction.id, () =>
      financeService.transactions.remove(transaction.id),
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Filter className="size-4" />
          Filtros
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <input
            type="date"
            aria-label="Data inicial"
            value={filters.from}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                from: event.target.value,
              }))
            }
            className={inputClassName}
          />

          <input
            type="date"
            aria-label="Data final"
            value={filters.to}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                to: event.target.value,
              }))
            }
            className={inputClassName}
          />

          <select
            aria-label="Tipo"
            value={filters.type ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                type:
                  (event.target
                    .value as FinancialTransactionType) ||
                  undefined,
              }))
            }
            className={inputClassName}
          >
            <option value="">Todos os tipos</option>
            <option value="INCOME">Receitas</option>
            <option value="EXPENSE">Despesas</option>
          </select>

          <select
            aria-label="Situação"
            value={filters.status ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status:
                  (event.target
                    .value as FinancialTransactionStatus) ||
                  undefined,
              }))
            }
            className={inputClassName}
          >
            <option value="">Todas as situações</option>
            <option value="PENDING">Pendentes</option>
            <option value="PAID">Pagos</option>
            <option value="CANCELLED">Cancelados</option>
          </select>

          <select
            aria-label="Conta"
            value={filters.accountId ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                accountId: event.target.value || undefined,
              }))
            }
            className={inputClassName}
          >
            <option value="">Todas as contas</option>

            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Categoria"
            value={filters.categoryId ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                categoryId: event.target.value || undefined,
              }))
            }
            className={inputClassName}
          >
            <option value="">Todas as categorias</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Receitas
          </p>
          <p className="mt-2 text-xl font-semibold text-emerald-300">
            {currencyFormatter.format(totals.income)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Despesas
          </p>
          <p className="mt-2 text-xl font-semibold text-rose-300">
            {currencyFormatter.format(totals.expense)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Resultado
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            {currencyFormatter.format(
              totals.income - totals.expense,
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-white">
            Lançamentos
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {transactions.length} encontrados
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          <Plus className="size-4" />
          Novo
        </button>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-4 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-60 items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/[0.03]">
          <LoaderCircle className="size-6 animate-spin text-zinc-500" />
        </div>
      ) : null}

      {!loading && transactions.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
          <ReceiptText className="size-8 text-zinc-600" />
          <p className="mt-4 font-medium text-zinc-300">
            Nenhum lançamento encontrado
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Ajuste os filtros ou registre um novo lançamento.
          </p>
        </div>
      ) : null}

      {!loading && transactions.length > 0 ? (
        <FinanceCompactList
          columns={[
            "Data",
            "Descrição",
            "Conta",
            "Categoria",
            "Situação",
            "Valor",
            "Ações",
          ]}
          gridClassName="lg:grid-cols-[7rem_minmax(12rem,1.4fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_8rem_9rem_10rem]"
        >
          {transactions.map((transaction) => {
            const processing = actionId === transaction.id;
            const statusTone =
              transaction.status === "CANCELLED"
                ? "danger"
                : transaction.status === "PAID"
                  ? "positive"
                  : transaction.overdue
                    ? "warning"
                    : "muted";

            return (
              <FinanceCompactRow
                key={transaction.id}
                gridClassName="lg:grid-cols-[7rem_minmax(12rem,1.4fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_8rem_9rem_10rem]"
                className={
                  transaction.status === "CANCELLED"
                    ? "bg-white/[0.012]"
                    : undefined
                }
              >
                <FinanceCell className="hidden text-sm text-zinc-400 lg:block">
                  {formatDate(transaction.transactionDate)}
                </FinanceCell>

                <FinanceCell>
                  <div className="flex items-start justify-between gap-3 lg:block">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {transaction.description}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 lg:hidden">
                        {formatDate(transaction.transactionDate)}
                        {" · "}
                        {transaction.accountName}
                      </p>
                    </div>
                    <p
                      className={[
                        "shrink-0 text-right text-sm font-semibold tabular-nums lg:hidden",
                        transaction.type === "INCOME"
                          ? "text-emerald-300"
                          : "text-rose-300",
                      ].join(" ")}
                    >
                      {transaction.type === "INCOME" ? "+" : "-"}{" "}
                      {currencyFormatter.format(transaction.amount)}
                    </p>
                  </div>
                </FinanceCell>

                <FinanceCell className="mt-2 text-xs text-zinc-500 lg:mt-0 lg:text-sm lg:text-zinc-400">
                  {transaction.accountName}
                </FinanceCell>

                <FinanceCell className="mt-1 text-xs text-zinc-500 lg:mt-0 lg:text-sm lg:text-zinc-400">
                  {transaction.categoryName ?? "Sem categoria"}
                </FinanceCell>

                <FinanceCell className="mt-2 lg:mt-0">
                  <div className="flex flex-wrap gap-2">
                    <FinanceStatusPill tone={statusTone}>
                      {statusLabel(transaction.status)}
                    </FinanceStatusPill>
                    {transaction.overdue ? (
                      <FinanceStatusPill tone="warning">
                        Vencido
                      </FinanceStatusPill>
                    ) : null}
                    {transaction.recurrenceId ? (
                      <FinanceStatusPill>Recorrente</FinanceStatusPill>
                    ) : null}
                  </div>
                </FinanceCell>

                <FinanceCell
                  className={[
                    "hidden text-right text-sm font-semibold tabular-nums lg:block",
                    transaction.type === "INCOME"
                      ? "text-emerald-300"
                      : "text-rose-300",
                  ].join(" ")}
                >
                  {transaction.type === "INCOME" ? "+" : "-"}{" "}
                  {currencyFormatter.format(transaction.amount)}
                </FinanceCell>

                <FinanceCell className="mt-3 lg:mt-0">
                  <div className="flex flex-wrap justify-end gap-1">
                    {processing ? (
                      <div className="flex size-9 items-center justify-center">
                        <LoaderCircle className="size-4 animate-spin text-zinc-500" />
                      </div>
                    ) : (
                      <>
                        {transaction.status === "PENDING" ? (
                          <button
                            type="button"
                            title="Marcar como pago"
                            aria-label="Marcar como pago"
                            onClick={() =>
                              void executeAction(
                                transaction.id,
                                () =>
                                  financeService.transactions.pay(
                                    transaction.id,
                                  ),
                              )
                            }
                            className="flex size-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-emerald-400/10 hover:text-emerald-300"
                          >
                            <Check className="size-4" />
                          </button>
                        ) : null}

                        {transaction.status === "PAID" ? (
                          <button
                            type="button"
                            title="Retornar para pendente"
                            aria-label="Retornar para pendente"
                            onClick={() =>
                              void executeAction(
                                transaction.id,
                                () =>
                                  financeService.transactions.markPending(
                                    transaction.id,
                                  ),
                              )
                            }
                            className="flex size-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/10 hover:text-white"
                          >
                            <RotateCcw className="size-4" />
                          </button>
                        ) : null}

                        {transaction.status !== "CANCELLED" ? (
                          <>
                            <button
                              type="button"
                              title="Editar"
                              aria-label="Editar lançamento"
                              onClick={() => openEditForm(transaction)}
                              className="flex size-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/10 hover:text-white"
                            >
                              <Pencil className="size-4" />
                            </button>

                            <button
                              type="button"
                              title="Cancelar lançamento"
                              aria-label="Cancelar lançamento"
                              onClick={() =>
                                void executeAction(
                                  transaction.id,
                                  () =>
                                    financeService.transactions.cancel(
                                      transaction.id,
                                    ),
                                )
                              }
                              className="flex size-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-amber-400/10 hover:text-amber-300"
                            >
                              <CircleX className="size-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            title="Restaurar lançamento"
                            aria-label="Restaurar lançamento"
                            onClick={() =>
                              void executeAction(
                                transaction.id,
                                () =>
                                  financeService.transactions.restore(
                                    transaction.id,
                                  ),
                              )
                            }
                            className="flex size-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/10 hover:text-white"
                          >
                            <RotateCcw className="size-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          title="Excluir"
                          aria-label="Excluir lançamento"
                          onClick={() => removeTransaction(transaction)}
                          className="flex size-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-rose-400/10 hover:text-rose-300"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </>
                    )}
                  </div>
                </FinanceCell>
              </FinanceCompactRow>
            );
          })}
        </FinanceCompactList>
      ) : null}
      {formOpen ? (
        <FinancialTransactionForm
          key={editing?.id ?? "new"}
          transaction={editing}
          accounts={accounts}
          categories={categories}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      ) : null}
    </div>
  );
}
