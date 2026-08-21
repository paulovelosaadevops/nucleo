"use client";

import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  LoaderCircle,
  RefreshCw,
  Scale,
  Wallet,
} from "lucide-react";

import { FinanceSummaryCard } from "./finance-summary-card";
import { useFinanceDashboard } from "./use-finance-dashboard";

import type { FinancialCategorySummary } from "@/types/finance";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function CategoryDistribution({
  title,
  categories,
  emptyMessage,
}: {
  title: string;
  categories: FinancialCategorySummary[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-white">
          {title}
        </h2>

        <span className="text-xs text-zinc-500">
          {categories.length}{" "}
          {categories.length === 1 ? "categoria" : "categorias"}
        </span>
      </div>

      {categories.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-5 text-center">
          <p className="max-w-xs text-sm leading-6 text-zinc-500">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {categories.map((category) => {
            const percentage = Math.min(
              Math.max(category.percentage, 0),
              100,
            );

            return (
              <article key={category.categoryId}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {category.categoryName}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {category.transactionCount}{" "}
                      {category.transactionCount === 1
                        ? "lançamento"
                        : "lançamentos"}
                    </p>
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
                    className="h-full rounded-full bg-gradient-to-r from-zinc-500 to-white transition-[width] duration-500"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/[0.035]"
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/[0.035]"
          />
        ))}
      </div>
    </div>
  );
}

export function FinanceOverview() {
  const {
    dashboard,
    error,
    loading,
    refreshing,
    periodLabel,
    previousMonth,
    nextMonth,
    currentMonth,
    refresh,
  } = useFinanceDashboard();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <button
            type="button"
            onClick={previousMonth}
            aria-label="Mês anterior"
            className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowLeft className="size-4" />
          </button>

          <p className="min-w-40 text-center text-sm font-medium capitalize text-zinc-200">
            {periodLabel}
          </p>

          <button
            type="button"
            onClick={nextMonth}
            aria-label="Próximo mês"
            className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={currentMonth}
            className="flex h-10 flex-1 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white sm:flex-none"
          >
            Mês atual
          </button>

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            aria-label="Atualizar visão geral"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={[
                "size-4",
                refreshing ? "animate-spin" : "",
              ].join(" ")}
            />
          </button>
        </div>
      </div>

      {loading ? <DashboardSkeleton /> : null}

      {!loading && error ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-[1.75rem] border border-rose-400/20 bg-rose-400/[0.04] p-6 text-center">
          <AlertCircle className="size-8 text-rose-300" />

          <h2 className="mt-4 text-base font-semibold text-white">
            Não foi possível carregar as finanças
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            <RefreshCw className="size-4" />
            Tentar novamente
          </button>
        </div>
      ) : null}

      {!loading && !error && !dashboard ? (
        <div className="flex min-h-64 items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/[0.035]">
          <LoaderCircle className="size-6 animate-spin text-zinc-500" />
        </div>
      ) : null}

      {!loading && !error && dashboard ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FinanceSummaryCard
              label="Saldo total"
              value={formatCurrency(
                dashboard.totalAccountBalance,
              )}
              description="Saldo atual das contas incluídas no total"
              icon={Wallet}
            />

            <FinanceSummaryCard
              label="Receitas"
              value={formatCurrency(dashboard.totalIncome)}
              description={`${formatCurrency(
                dashboard.pendingIncome,
              )} ainda pendentes`}
              icon={ArrowUpRight}
              emphasis="positive"
            />

            <FinanceSummaryCard
              label="Despesas"
              value={formatCurrency(dashboard.totalExpense)}
              description={`${formatCurrency(
                dashboard.pendingExpense,
              )} ainda pendentes`}
              icon={ArrowDownLeft}
              emphasis="negative"
            />

            <FinanceSummaryCard
              label="Resultado do período"
              value={formatCurrency(dashboard.periodBalance)}
              description={
                dashboard.periodBalance >= 0
                  ? "Receitas superiores às despesas"
                  : "Despesas superiores às receitas"
              }
              icon={Scale}
              emphasis={
                dashboard.periodBalance >= 0
                  ? "positive"
                  : "negative"
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FinanceSummaryCard
              label="Despesas vencidas"
              value={formatCurrency(dashboard.overdueExpense)}
              description="Valor pendente com vencimento ultrapassado"
              icon={CalendarClock}
              emphasis={
                dashboard.overdueExpense > 0
                  ? "warning"
                  : "default"
              }
            />

            <FinanceSummaryCard
              label="Lançamentos vencidos"
              value={String(
                dashboard.overdueTransactionCount,
              )}
              description="Quantidade de lançamentos aguardando pagamento"
              icon={AlertCircle}
              emphasis={
                dashboard.overdueTransactionCount > 0
                  ? "warning"
                  : "default"
              }
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <CategoryDistribution
              title="Receitas por categoria"
              categories={dashboard.incomeByCategory}
              emptyMessage="Nenhuma receita foi registrada neste período."
            />

            <CategoryDistribution
              title="Despesas por categoria"
              categories={dashboard.expenseByCategory}
              emptyMessage="Nenhuma despesa foi registrada neste período."
            />
          </div>
        </>
      ) : null}
    </div>
  );
}