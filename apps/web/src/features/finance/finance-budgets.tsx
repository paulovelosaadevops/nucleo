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

  function removeBudget(budget: FinancialBudget) {
    const confirmed = window.confirm(
      `Deseja excluir o orçamento de "${budget.categoryName}"?`,
    );

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
        <div className="grid gap-3 lg:grid-cols-2">
          {budgets.map((budget) => {
            const percentage = Math.min(
              Math.max(budget.consumptionPercentage, 0),
              100,
            );

            const accent =
              budget.status === "EXCEEDED"
                ? "bg-rose-400"
                : budget.status === "ALERT"
                  ? "bg-amber-300"
                  : "bg-white";

            return (
              <article
                key={budget.id}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">
                      {budget.categoryName}
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      Alerta em {budget.alertPercentage}%
                    </p>
                  </div>

                  {actionId === budget.id ? (
                    <LoaderCircle className="size-4 animate-spin text-zinc-500" />
                  ) : (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        title="Editar"
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
                        onClick={() => removeBudget(budget)}
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-rose-400/10 hover:text-rose-300"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-zinc-600">
                      Comprometido
                    </p>
                    <p className="mt-1 font-semibold text-white">
                      {currencyFormatter.format(
                        budget.committedAmount,
                      )}
                    </p>
                  </div>

                  <p className="text-sm text-zinc-500">
                    de{" "}
                    {currencyFormatter.format(
                      budget.limitAmount,
                    )}
                  </p>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full ${accent}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
                    {budget.consumptionPercentage.toLocaleString(
                      "pt-BR",
                      {
                        maximumFractionDigits: 1,
                      },
                    )}
                    %
                  </span>

                  <span
                    className={
                      budget.remainingAmount < 0
                        ? "text-rose-300"
                        : "text-zinc-400"
                    }
                  >
                    {currencyFormatter.format(
                      budget.remainingAmount,
                    )}{" "}
                    restantes
                  </span>
                </div>
              </article>
            );
          })}
        </div>
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