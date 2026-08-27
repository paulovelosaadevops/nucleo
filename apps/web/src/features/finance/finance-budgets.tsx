"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";

import { financeService } from "./finance-service";
import { confirmDialog } from "@/lib/feedback";
import {
  FinanceCell,
  FinanceCompactList,
  FinanceCompactRow,
  FinanceStatusPill,
} from "./finance-compact-list";
import { FinancialBudgetForm } from "./financial-budget-form";

import type {
  CreateFinancialBudgetRequest,
  FinancialBudget,
  FinancialCategory,
  UpdateFinancialBudgetRequest,
} from "@/types/finance";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function monthReference(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
}

function monthLabel(referenceMonth: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${referenceMonth}T00:00:00`));
}

export function FinanceBudgets() {
  const [referenceMonth, setReferenceMonth] = useState(() =>
    monthReference(new Date()),
  );

  const [budgets, setBudgets] = useState<FinancialBudget[]>([]);
  const [categories, setCategories] = useState<
    FinancialCategory[]
  >([]);

  const [editing, setEditing] =
    useState<FinancialBudget | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalCommitted = useMemo(
    () =>
      budgets.reduce(
        (total, budget) => total + budget.committedAmount,
        0,
      ),
    [budgets],
  );

  const totalLimit = useMemo(
    () =>
      budgets.reduce(
        (total, budget) => total + budget.limitAmount,
        0,
      ),
    [budgets],
  );

  const loadCategories = useCallback(async () => {
    setCategories(
      await financeService.categories.list("EXPENSE"),
    );
  }, []);

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setBudgets(
        await financeService.budgets.list(referenceMonth),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar os orçamentos.",
      );
    } finally {
      setLoading(false);
    }
  }, [referenceMonth]);

  useEffect(() => {
    void loadCategories().catch((requestError) => {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar as categorias.",
      );
    });
  }, [loadCategories]);

  useEffect(() => {
    void loadBudgets();
  }, [loadBudgets]);

  function changeMonth(offset: number) {
    const current = new Date(`${referenceMonth}T00:00:00`);

    setReferenceMonth(
      monthReference(
        new Date(
          current.getFullYear(),
          current.getMonth() + offset,
          1,
        ),
      ),
    );
  }

  async function handleSubmit(
    request:
      | CreateFinancialBudgetRequest
      | UpdateFinancialBudgetRequest,
  ) {
    setSubmitting(true);

    try {
      if (editing) {
        await financeService.budgets.update(
          editing.id,
          request as UpdateFinancialBudgetRequest,
        );
      } else {
        await financeService.budgets.create(
          request as CreateFinancialBudgetRequest,
        );
      }

      setFormOpen(false);
      setEditing(null);
      await loadBudgets();
    } finally {
      setSubmitting(false);
    }
  }

  async function removeBudget(budget: FinancialBudget) {
    const confirmed = await confirmDialog({
      title: "Excluir orcamento",
      description: `Deseja excluir o orcamento de "${budget.categoryName}"?`,
      confirmLabel: "Excluir",
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    setActionId(budget.id);
    setError(null);

    void financeService.budgets
      .remove(budget.id)
      .then(loadBudgets)
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível excluir o orçamento.",
        );
      })
      .finally(() => setActionId(null));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold text-white">
            Orçamentos mensais
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Controle limites por categoria
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-black"
        >
          <Plus className="size-4" />
          Novo orçamento
        </button>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <button
          type="button"
          aria-label="Mês anterior"
          onClick={() => changeMonth(-1)}
          className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400"
        >
          <ArrowLeft className="size-4" />
        </button>

        <p className="text-sm font-medium capitalize text-white">
          {monthLabel(referenceMonth)}
        </p>

        <button
          type="button"
          aria-label="Próximo mês"
          onClick={() => changeMonth(1)}
          className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Limite planejado
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            {currencyFormatter.format(totalLimit)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Total comprometido
          </p>
          <p className="mt-2 text-xl font-semibold text-white">
            {currencyFormatter.format(totalCommitted)}
          </p>
        </div>
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

      {!loading && budgets.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 text-center">
          <WalletCards className="size-8 text-zinc-600" />
          <p className="mt-4 font-medium text-zinc-300">
            Nenhum orçamento neste mês
          </p>
        </div>
      ) : null}

      {!loading && budgets.length > 0 ? (
        <FinanceCompactList
          columns={[
            "Categoria",
            "Planejado",
            "Consumido",
            "%",
            "Saldo",
            "Situação",
            "Ações",
          ]}
          gridClassName="lg:grid-cols-[minmax(13rem,1.5fr)_9rem_9rem_6rem_9rem_8rem_7rem]"
        >
          {budgets.map((budget) => {
            const percentage = Math.min(
              Math.max(budget.consumptionPercentage, 0),
              100,
            );
            const statusTone =
              budget.status === "EXCEEDED"
                ? "danger"
                : budget.status === "ALERT"
                  ? "warning"
                  : "positive";
            const statusLabel =
              budget.status === "EXCEEDED"
                ? "Excedido"
                : budget.status === "ALERT"
                  ? "Alerta"
                  : "Ok";
            const accent =
              budget.status === "EXCEEDED"
                ? "bg-rose-400"
                : budget.status === "ALERT"
                  ? "bg-amber-300"
                  : "bg-white";

            return (
              <FinanceCompactRow
                key={budget.id}
                gridClassName="lg:grid-cols-[minmax(13rem,1.5fr)_9rem_9rem_6rem_9rem_8rem_7rem]"
              >
                <FinanceCell>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {budget.categoryName}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06] lg:max-w-xs">
                      <div
                        className={`h-full rounded-full ${accent}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </FinanceCell>

                <FinanceCell className="mt-3 text-xs text-zinc-500 tabular-nums lg:mt-0 lg:text-right lg:text-sm lg:text-zinc-400">
                  {currencyFormatter.format(budget.limitAmount)}
                </FinanceCell>

                <FinanceCell className="mt-1 text-sm font-semibold text-white tabular-nums lg:mt-0 lg:text-right">
                  {currencyFormatter.format(budget.committedAmount)}
                </FinanceCell>

                <FinanceCell className="mt-1 text-xs text-zinc-500 tabular-nums lg:mt-0 lg:text-right lg:text-sm lg:text-zinc-400">
                  {budget.consumptionPercentage.toLocaleString("pt-BR", {
                    maximumFractionDigits: 1,
                  })}
                  %
                </FinanceCell>

                <FinanceCell
                  className={[
                    "mt-1 text-xs tabular-nums lg:mt-0 lg:text-right lg:text-sm",
                    budget.remainingAmount < 0
                      ? "text-rose-300"
                      : "text-zinc-400",
                  ].join(" ")}
                >
                  {currencyFormatter.format(budget.remainingAmount)}
                </FinanceCell>

                <FinanceCell className="mt-2 lg:mt-0">
                  <FinanceStatusPill tone={statusTone}>
                    {statusLabel}
                  </FinanceStatusPill>
                </FinanceCell>

                <FinanceCell className="mt-3 lg:mt-0">
                  {actionId === budget.id ? (
                    <div className="flex size-9 items-center justify-end">
                      <LoaderCircle className="size-4 animate-spin text-zinc-500" />
                    </div>
                  ) : (
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title="Editar"
                        aria-label="Editar orçamento"
                        onClick={() => {
                          setEditing(budget);
                          setFormOpen(true);
                        }}
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="size-4" />
                      </button>

                      <button
                        type="button"
                        title="Excluir"
                        aria-label="Excluir orçamento"
                        onClick={() => removeBudget(budget)}
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
        <FinancialBudgetForm
          key={editing?.id ?? "new-budget"}
          budget={editing}
          categories={categories}
          referenceMonth={referenceMonth}
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
