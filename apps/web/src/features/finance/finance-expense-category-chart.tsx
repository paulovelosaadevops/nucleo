"use client";

import { useState } from "react";

import type { FinancialCategorySummary } from "@/types/finance";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function FinanceExpenseCategoryChart({
  categories,
}: {
  categories: FinancialCategorySummary[];
}) {
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(
    null,
  );
  const total = categories.reduce((sum, category) => sum + category.total, 0);
  const visibleCategories = categories.slice(0, 8);
  const selectedCategory = visibleCategories.find(
    (category) =>
      (category.categoryId ?? category.categoryName) === selectedCategoryKey,
  );

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">
            Gastos por categoria
          </h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Despesas realizadas no mês selecionado, sem duplicar pagamentos de
            fatura.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-zinc-500">Total</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      {visibleCategories.length === 0 ? (
        <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-5 text-center text-sm text-zinc-500">
          Nenhuma despesa realizada neste período.
        </div>
      ) : (
        <div className="space-y-2">
          {selectedCategory ? (
            <div className="rounded-2xl border border-white/[0.08] bg-black/15 px-3 py-2 text-sm text-zinc-300">
              {selectedCategory.categoryName}:{" "}
              <strong className="font-semibold text-white">
                {formatCurrency(selectedCategory.total)}
              </strong>
            </div>
          ) : null}

          {visibleCategories.map((category) => {
            const categoryKey = category.categoryId ?? category.categoryName;
            const selected = selectedCategoryKey === categoryKey;
            const color = category.color ?? "#d4d4d8";

            return (
              <button
                key={categoryKey}
                type="button"
                title={`${category.categoryName}: ${formatCurrency(category.total)}`}
                aria-label={`${category.categoryName}: ${formatCurrency(category.total)}`}
                onClick={() =>
                  setSelectedCategoryKey(selected ? null : categoryKey)
                }
                className={[
                  "block w-full rounded-xl p-2 text-left outline-none transition hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-white/40",
                  selected ? "bg-white/[0.07]" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-2">
                    <span
                      className="mt-1 size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {category.categoryName}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {category.transactionCount} lançamento(s)
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(category.total)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {category.percentage.toLocaleString("pt-BR", {
                        maximumFractionDigits: 1,
                      })}
                      %
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(Math.max(category.percentage, 0), 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
