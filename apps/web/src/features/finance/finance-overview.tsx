"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { financeService } from "./finance-service";
import { useFinanceDashboard } from "./use-finance-dashboard";

import type {
  FinanceSection,
  FinancialBudgetProgress,
  FinancialCategorySummary,
  FinancialDashboard,
  FinancialDashboardRecurrence,
  FinancialInstallmentCommitment,
} from "@/types/finance";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const shortMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR");

type HistoryRange = 3 | 6 | 12;

function date(value: string) {
  return new Date(`${value}T12:00:00`);
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string) {
  return dateFormatter.format(date(value));
}

function monthPeriod(base: Date, offset: number) {
  const start = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const end = new Date(base.getFullYear(), base.getMonth() + offset + 1, 0);
  const toInput = (item: Date) =>
    [
      item.getFullYear(),
      String(item.getMonth() + 1).padStart(2, "0"),
      String(item.getDate()).padStart(2, "0"),
    ].join("-");

  return { from: toInput(start), to: toInput(end) };
}

function CompactMetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof Wallet;
  tone?: "neutral" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-300"
      : tone === "negative"
        ? "text-rose-300"
        : "text-white";

  return (
    <article className="min-h-28 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs text-zinc-500">{label}</p>
        <Icon className="size-4 shrink-0 text-zinc-500" />
      </div>
      <p className={`mt-3 truncate text-lg font-semibold ${toneClass}`}>
        {value}
      </p>
      <p className="mt-1 line-clamp-2 text-xs leading-4 text-zinc-500">
        {description}
      </p>
    </article>
  );
}

function ChartCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function PeriodSelector<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={[
            "h-8 rounded-lg px-3 text-xs font-medium transition",
            value === option.value
              ? "bg-white text-black"
              : "text-zinc-400 hover:text-white",
          ].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function FinancialSummaryChart({
  months,
  loading,
}: {
  months: FinancialDashboard[];
  loading: boolean;
}) {
  const rows = months.map((dashboard) => ({
    key: dashboard.from,
    label: shortMonthFormatter.format(date(dashboard.from)).replace(".", ""),
    income: Math.max(dashboard.totalIncome, 0),
    expense: Math.max(dashboard.totalExpense, 0),
    invoice: Math.max(dashboard.currentInvoiceAmount, 0),
    balance: dashboard.periodBalance,
    current: dashboard.from.slice(0, 7) === new Date().toISOString().slice(0, 7),
  }));
  const maxValue = Math.max(
    ...rows.flatMap((row) => [row.income, row.expense, row.invoice]),
    1,
  );

  if (loading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-white/[0.04]" />;
  }

  if (rows.length === 0) {
    return <EmptyChartState text="Sem dados suficientes para o resumo." />;
  }

  return (
    <div>
      <div className="flex h-48 items-end gap-2 border-b border-white/10 pb-6">
        {rows.map((row) => (
          <div key={row.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-36 w-full items-end justify-center gap-1">
              {[
                ["Receitas", row.income, "bg-emerald-300/80"],
                ["Despesas", row.expense, "bg-zinc-100"],
                ["Faturas", row.invoice, "bg-zinc-500"],
              ].map(([label, value, className]) => (
                <span
                  key={label}
                  title={`${label}: ${formatCurrency(Number(value))}`}
                  className={`w-2 rounded-t-sm ${className}`}
                  style={{
                    height: `${Math.max((Number(value) / maxValue) * 100, Number(value) > 0 ? 6 : 2)}%`,
                  }}
                />
              ))}
            </div>
            <span
              className={[
                "truncate text-[0.62rem] uppercase",
                row.current ? "font-semibold text-white" : "text-zinc-500",
              ].join(" ")}
            >
              {row.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
        <LegendDot color="bg-emerald-300/80" label="Receitas" />
        <LegendDot color="bg-zinc-100" label="Despesas" />
        <LegendDot color="bg-zinc-500" label="Faturas" />
      </div>
    </div>
  );
}

function CategoryBreakdownChart({
  categories,
}: {
  categories: FinancialCategorySummary[];
}) {
  const [showAll, setShowAll] = useState(false);
  const total = categories.reduce((sum, item) => sum + item.total, 0);
  const top = categories.slice(0, 5);
  const otherItems = categories.slice(5);
  const otherTotal = otherItems.reduce((sum, item) => sum + item.total, 0);
  const entries = showAll || otherItems.length === 0
    ? categories
    : [
        ...top,
        {
          categoryId: "other",
          categoryName: "Outras",
          color: "#71717a",
          icon: null,
          type: "EXPENSE" as const,
          transactionCount: otherItems.reduce((sum, item) => sum + item.transactionCount, 0),
          total: otherTotal,
          percentage: total > 0 ? (otherTotal / total) * 100 : 0,
        },
      ].filter((item) => item.total > 0);
  const segments = entries
    .filter((item) => item.total > 0)
    .reduce<{ cursor: number; values: string[] }>(
      (state, item, index) => {
        const start = state.cursor;
        const share = total > 0 ? (item.total / total) * 100 : 0;
        const end = start + share;
        const color = item.color ?? ["#f8fafc", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b"][index % 5];

        return {
          cursor: end,
          values: [...state.values, `${color} ${start}% ${end}%`],
        };
      },
      { cursor: 0, values: [] },
    )
    .values.join(", ");

  if (categories.length === 0) {
    return <EmptyChartState text="Nenhuma despesa realizada neste período." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-[9rem_minmax(0,1fr)] md:items-center">
      <div
        className="relative mx-auto hidden size-36 place-items-center rounded-full md:grid"
        style={{
          background: segments
            ? `conic-gradient(${segments})`
            : "conic-gradient(rgba(255,255,255,0.12) 0 100%)",
        }}
      >
        <div className="grid size-24 place-items-center rounded-full bg-[#090909] text-center">
          <span className="text-[0.65rem] text-zinc-500">Total</span>
          <span className="text-xs font-semibold text-white">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 md:hidden">
          <span className="text-xs text-zinc-500">Total considerado</span>
          <span className="text-sm font-semibold text-white">
            {formatCurrency(total)}
          </span>
        </div>
        {entries.map((item, index) => {
          const color = item.color ?? ["#f8fafc", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b"][index % 5];
          return (
            <div key={item.categoryId ?? item.categoryName}>
              <div className="flex items-center gap-2 text-sm">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="min-w-0 flex-1 truncate text-zinc-300">{item.categoryName}</span>
                <span className="shrink-0 text-xs text-zinc-500">
                  {item.percentage.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                </span>
                <span className="w-24 shrink-0 text-right font-medium text-white">
                  {formatCurrency(item.total)}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06] md:hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(item.percentage, 100)}%`, backgroundColor: color }} />
              </div>
            </div>
          );
        })}
        {otherItems.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="mt-2 text-xs font-medium text-zinc-300 hover:text-white"
          >
            {showAll ? "Ver menos" : "Ver todas"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Attention({ dashboard }: { dashboard: FinancialDashboard }) {
  const alerts = [
    ...dashboard.upcomingItems
      .filter((item) => item.overdue || daysUntil(item.dueDate) <= 5)
      .map((item) => ({
        key: `${item.kind}-${item.id}`,
        title: item.description,
        detail: `${item.sourceName} · ${formatDate(item.dueDate)} · ${formatCurrency(item.amount)}`,
        urgent: item.overdue,
        date: item.dueDate,
      })),
    ...dashboard.budgets
      .filter((budget) => budget.status !== "SAFE" || budget.consumptionPercentage >= 80)
      .map((budget) => ({
        key: budget.budgetId,
        title: budget.categoryName,
        detail: `${budget.consumptionPercentage.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% do orçamento usado`,
        urgent: budget.status === "EXCEEDED",
        date: dashboard.to,
      })),
  ]
    .sort((left, right) => Number(right.urgent) - Number(left.urgent) || left.date.localeCompare(right.date))
    .slice(0, 5);

  return (
    <ChartCard title="Atenção">
      {alerts.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
          <ShieldCheck className="size-5 text-emerald-300" />
          <p className="text-sm text-zinc-400">Nada crítico para este período.</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.07]">
          {alerts.map((item) => (
            <div key={item.key} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
              <span className={item.urgent ? "size-2 rounded-full bg-rose-300" : "size-2 rounded-full bg-zinc-400"} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-200">{item.title}</p>
                <p className="truncate text-xs text-zinc-500">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

function CompactPreviewList({
  title,
  value,
  description,
  actionLabel,
  onAction,
  items,
}: {
  title: string;
  value: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
  items: Array<{ id: string; title: string; detail: string; amount: number }>;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="mt-1 text-xl font-semibold text-white">{value}</p>
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        </div>
        {onAction ? (
          <button type="button" onClick={onAction} className="text-xs font-medium text-zinc-300 hover:text-white">
            {actionLabel}
          </button>
        ) : null}
      </div>
      <div className="mt-3 divide-y divide-white/[0.07]">
        {items.length === 0 ? (
          <p className="py-2 text-sm text-zinc-500">Nenhum item próximo.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-300">{item.title}</p>
                <p className="truncate text-xs text-zinc-500">{item.detail}</p>
              </div>
              <span className="shrink-0 text-sm font-medium text-white">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function BudgetCompact({
  budgets,
  onAction,
}: {
  budgets: FinancialBudgetProgress[];
  onAction?: () => void;
}) {
  const totalLimit = budgets.reduce((sum, item) => sum + item.limitAmount, 0);
  const totalUsed = budgets.reduce((sum, item) => sum + item.committedAmount, 0);
  const remaining = totalLimit - totalUsed;
  const percentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
  const critical = [...budgets]
    .sort((left, right) => right.consumptionPercentage - left.consumptionPercentage)
    .slice(0, 3);

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Orçamentos</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {formatCurrency(totalUsed)} de {formatCurrency(totalLimit)}
          </p>
        </div>
        {onAction ? (
          <button type="button" onClick={onAction} className="text-xs font-medium text-zinc-300 hover:text-white">
            Ver todos
          </button>
        ) : null}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
      <div className="mt-3 flex justify-between text-xs text-zinc-500">
        <span>Disponível</span>
        <span className={remaining < 0 ? "text-rose-300" : "text-zinc-300"}>{formatCurrency(remaining)}</span>
      </div>
      <div className="mt-3 space-y-2">
        {critical.map((item) => (
          <div key={item.budgetId} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-zinc-300">{item.categoryName}</span>
            <span className={item.status === "EXCEEDED" ? "text-rose-300" : item.status === "ALERT" ? "text-amber-200" : "text-zinc-500"}>
              {item.consumptionPercentage.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyChartState({ text }: { text: string }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-5 text-center text-sm text-zinc-500">
      {text}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function daysUntil(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date(value).getTime() - today.getTime()) / 86_400_000);
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.035]" />
      ))}
    </div>
  );
}

export function FinanceOverview({
  onOpenInvestments,
  onSectionChange,
}: {
  onOpenInvestments?: () => void;
  onSectionChange?: (section: FinanceSection) => void;
}) {
  const { dashboard, error, loading, refreshing, periodLabel, period, previousMonth, nextMonth, currentMonth, refresh } = useFinanceDashboard();
  const [historyRange, setHistoryRange] = useState<HistoryRange>(6);
  const [history, setHistory] = useState<FinancialDashboard[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const base = date(period.from);
    const loadingTimeout = window.setTimeout(() => {
      if (active) setHistoryLoading(true);
    }, 0);

    Promise.all(
      Array.from({ length: historyRange }, (_, index) => {
        const item = monthPeriod(base, index - historyRange + 1);
        return financeService.dashboard.get(item.from, item.to);
      }),
    )
      .then((items) => {
        if (active) setHistory(items);
      })
      .catch(() => {
        if (active) setHistory([]);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(loadingTimeout);
    };
  }, [historyRange, period.from]);

  const recurrenceItems = useMemo(
    () =>
      (dashboard?.recurrences ?? []).slice(0, 3).map((item: FinancialDashboardRecurrence) => ({
        id: item.id,
        title: item.description,
        detail: `${item.sourceName} · ${formatDate(item.nextGenerationDate)}`,
        amount: item.amount,
      })),
    [dashboard],
  );
  const installmentItems = useMemo(
    () =>
      (dashboard?.installmentCommitments ?? []).slice(0, 3).map((item: FinancialInstallmentCommitment) => ({
        id: item.purchaseId,
        title: item.description,
        detail: `${item.creditCardName} · ${item.currentInstallment}/${item.totalInstallments} · ${formatDate(item.nextDueDate)}`,
        amount: item.installmentAmount,
      })),
    [dashboard],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <button type="button" onClick={previousMonth} aria-label="Mês anterior" className="flex size-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"><ArrowLeft className="size-4" /></button>
          <p className="min-w-36 text-center text-sm font-medium capitalize text-zinc-200">{periodLabel}</p>
          <button type="button" onClick={nextMonth} aria-label="Próximo mês" className="flex size-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"><ArrowRight className="size-4" /></button>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={currentMonth} className="flex h-9 flex-1 items-center justify-center rounded-xl border border-white/10 px-3 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white sm:flex-none">Mês atual</button>
          <button type="button" onClick={() => void refresh()} disabled={refreshing} aria-label="Atualizar visão geral" className="flex size-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"><RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} /></button>
        </div>
      </div>

      {loading ? <DashboardSkeleton /> : null}

      {!loading && error ? (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-[1.5rem] border border-rose-400/20 bg-rose-400/[0.04] p-6 text-center">
          <AlertCircle className="size-7 text-rose-300" />
          <h2 className="mt-3 font-semibold text-white">Não foi possível carregar as finanças</h2>
          <p className="mt-2 text-sm text-zinc-400">{error}</p>
          <button type="button" onClick={() => void refresh()} className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">Tentar novamente</button>
        </div>
      ) : null}

      {!loading && !error && !dashboard ? (
        <div className="flex min-h-40 items-center justify-center">
          <LoaderCircle className="size-6 animate-spin text-zinc-500" />
        </div>
      ) : null}

      {!loading && !error && dashboard ? (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
            <CompactMetricCard label="Saldo disponível" value={formatCurrency(dashboard.availableAccountBalance)} description="Contas consolidadas, sem investimentos" icon={Wallet} />
            <CompactMetricCard label="Receitas do mês" value={formatCurrency(dashboard.totalIncome)} description={`${formatCurrency(dashboard.pendingIncome)} a receber`} icon={ArrowUpRight} tone="positive" />
            <CompactMetricCard label="Despesas do mês" value={formatCurrency(dashboard.totalExpense)} description={`${formatCurrency(dashboard.pendingExpense)} pendentes`} icon={ArrowDownLeft} tone="negative" />
            <CompactMetricCard label="Fatura atual" value={formatCurrency(dashboard.currentInvoiceAmount)} description="Parcelas no mês selecionado" icon={CreditCard} />
            <button type="button" onClick={onOpenInvestments} className="text-left">
              <CompactMetricCard label="Investimentos" value={formatCurrency(dashboard.investmentBalance)} description={dashboard.investmentSummary?.valuationStatus === "RECONCILED" ? "Conciliado" : "Estimado"} icon={TrendingUp} />
            </button>
            <CompactMetricCard label="Patrimônio total" value={formatCurrency(dashboard.totalAccountBalance)} description="Saldo disponível + investimentos" icon={Wallet} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <ChartCard
              title="Resumo financeiro"
              action={
                <PeriodSelector
                  value={historyRange}
                  options={[
                    { value: 3, label: "3m" },
                    { value: 6, label: "6m" },
                    { value: 12, label: "12m" },
                  ]}
                  onChange={setHistoryRange}
                />
              }
            >
              <FinancialSummaryChart months={history} loading={historyLoading} />
            </ChartCard>

            <ChartCard title="Gastos por categoria">
              <CategoryBreakdownChart categories={dashboard.expenseByCategory} />
            </ChartCard>
          </div>

          <Attention dashboard={dashboard} />

          <div className="grid gap-4 xl:grid-cols-3">
            <CompactPreviewList
              title="Recorrências"
              value={formatCurrency(dashboard.recurringExpenseNext30Days)}
              description={`${dashboard.activeRecurrenceCount} ativa(s), próximos 30 dias`}
              actionLabel="Ver todas"
              onAction={() => onSectionChange?.("recurrences")}
              items={recurrenceItems}
            />
            <CompactPreviewList
              title="Parcelamentos"
              value={formatCurrency(dashboard.remainingInstallmentAmount)}
              description={`${dashboard.activeInstallmentPurchaseCount} compra(s) parcelada(s)`}
              actionLabel="Ver todos"
              onAction={() => onSectionChange?.("credit-cards")}
              items={installmentItems}
            />
            <BudgetCompact
              budgets={dashboard.budgets}
              onAction={() => onSectionChange?.("budgets")}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
