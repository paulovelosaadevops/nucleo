"use client";

import { FormEvent, useMemo, useState } from "react";
import { LoaderCircle, X } from "lucide-react";

import type {
  CreateFinancialBudgetRequest,
  FinancialBudget,
  FinancialCategory,
  UpdateFinancialBudgetRequest,
} from "@/types/finance";

type BudgetFormRequest =
  | CreateFinancialBudgetRequest
  | UpdateFinancialBudgetRequest;

interface FinancialBudgetFormProps {
  categories: FinancialCategory[];
  referenceMonth: string;
  budget?: FinancialBudget | null;
  submitting?: boolean;
  onSubmit: (request: BudgetFormRequest) => Promise<void>;
  onCancel: () => void;
}

const inputClassName =
  "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-white/25";

const labelClassName =
  "mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500";

export function FinancialBudgetForm({
  categories,
  referenceMonth,
  budget,
  submitting = false,
  onSubmit,
  onCancel,
}: FinancialBudgetFormProps) {
  const editing = Boolean(budget);

  const [categoryId, setCategoryId] = useState(
    budget?.categoryId ?? "",
  );

  const [month, setMonth] = useState(
    (budget?.referenceMonth ?? referenceMonth).slice(0, 7),
  );

  const [limitAmount, setLimitAmount] = useState(
    String(budget?.limitAmount ?? ""),
  );

  const [alertPercentage, setAlertPercentage] = useState(
    String(budget?.alertPercentage ?? 80),
  );

  const [error, setError] = useState<string | null>(null);

  const availableCategories = useMemo(
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

    const limit = Number(limitAmount);
    const alert = Number(alertPercentage);

    if (!editing && !categoryId) {
      setError("Selecione uma categoria.");
      return;
    }

    if (!Number.isFinite(limit) || limit <= 0) {
      setError("Informe um limite maior que zero.");
      return;
    }

    if (
      !Number.isFinite(alert) ||
      alert < 1 ||
      alert > 100
    ) {
      setError(
        "O percentual de alerta deve ficar entre 1 e 100.",
      );
      return;
    }

    try {
      if (editing) {
        const request: UpdateFinancialBudgetRequest = {
          limitAmount: limit,
          alertPercentage: alert,
        };

        await onSubmit(request);
        return;
      }

      if (!month) {
        setError("Informe o mês de referência.");
        return;
      }

      const request: CreateFinancialBudgetRequest = {
        categoryId,
        referenceMonth: `${month}-01`,
        limitAmount: limit,
        alertPercentage: alert,
      };

      await onSubmit(request);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível salvar o orçamento.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-6">
      <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#090909] sm:max-w-xl sm:rounded-[2rem]">
        <header className="flex items-start justify-between border-b border-white/10 p-5 sm:px-7">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Planejamento
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              {editing ? "Editar orçamento" : "Novo orçamento"}
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
          {!editing ? (
            <>
              <div>
                <label
                  htmlFor="budget-category"
                  className={labelClassName}
                >
                  Categoria de despesa
                </label>

                <select
                  id="budget-category"
                  value={categoryId}
                  disabled={submitting}
                  onChange={(event) =>
                    setCategoryId(event.target.value)
                  }
                  className={inputClassName}
                >
                  <option value="">Selecione</option>

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

              <div>
                <label
                  htmlFor="budget-month"
                  className={labelClassName}
                >
                  Mês de referência
                </label>

                <input
                  id="budget-month"
                  type="month"
                  value={month}
                  disabled={submitting}
                  onChange={(event) =>
                    setMonth(event.target.value)
                  }
                  className={inputClassName}
                />
              </div>
            </>
          ) : (
            <div>
              <span className={labelClassName}>Categoria</span>

              <div className="flex h-12 items-center rounded-2xl border border-white/10 bg-white/[0.025] px-4 text-sm text-zinc-300">
                {budget?.categoryName}
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="budget-limit"
              className={labelClassName}
            >
              Limite mensal
            </label>

            <input
              id="budget-limit"
              type="number"
              min="0.01"
              step="0.01"
              value={limitAmount}
              disabled={submitting}
              placeholder="0,00"
              onChange={(event) =>
                setLimitAmount(event.target.value)
              }
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="budget-alert"
              className={labelClassName}
            >
              Alertar ao atingir (%)
            </label>

            <input
              id="budget-alert"
              type="number"
              min="1"
              max="100"
              step="1"
              value={alertPercentage}
              disabled={submitting}
              onChange={(event) =>
                setAlertPercentage(event.target.value)
              }
              className={inputClassName}
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

              {editing ? "Salvar alterações" : "Criar orçamento"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}