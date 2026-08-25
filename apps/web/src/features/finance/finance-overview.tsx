"use client";

import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  Layers3,
  LoaderCircle,
  RefreshCw,
  Repeat2,
  Scale,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { FinanceSummaryCard } from "./finance-summary-card";
import {
  FinanceCell,
  FinanceCompactList,
  FinanceCompactRow,
  FinanceStatusPill,
} from "./finance-compact-list";
import { useFinanceDashboard } from "./use-finance-dashboard";

import type {
  FinancialBudgetProgress,
  FinancialCategorySummary,
  FinancialDashboardRecurrence,
  FinancialInstallmentCommitment,
  FinancialInvoiceProjection,
  FinancialMonthlyProjection,
  FinancialUpcomingItem,
} from "@/types/finance";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR");

function date(value: string) {
  return new Date(`${value}T12:00:00`);
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatMonth(value: string) {
  return monthFormatter.format(date(value));
}

function formatDate(value: string) {
  return dateFormatter.format(date(value));
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-5 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}

function CategoryDistribution({
  title,
  categories,
}: {
  title: string;
  categories: FinancialCategorySummary[];
}) {
  return (
    <Section title={title}>
      {categories.length === 0 ? (
        <Empty>Nenhum valor realizado neste período.</Empty>
      ) : (
        <div className="space-y-5">
          {categories.slice(0, 6).map((category) => (
            <article key={category.categoryId ?? category.categoryName}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {category.categoryName}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {category.transactionCount} lançamento(s)
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
                  className="h-full rounded-full bg-gradient-to-r from-zinc-500 to-white"
                  style={{
                    width: `${Math.min(Math.max(category.percentage, 0), 100)}%`,
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}

function Invoices({ invoices }: { invoices: FinancialInvoiceProjection[] }) {
  const statusLabel = {
    OPEN: "Aberta",
    CLOSED: "Fechada",
    PAID: "Paga",
    CANCELLED: "Cancelada",
  } as const;

  return (
    <Section
      title="Fatura atual e próximas 3"
      description="Valores já lançados; recorrências futuras aparecem na projeção até serem geradas."
    >
      {invoices.length === 0 ? (
        <Empty>Nenhuma fatura com lançamentos neste horizonte.</Empty>
      ) : (
        <FinanceCompactList
          columns={["Cartão", "Mês", "Vencimento", "Itens", "Situação", "Total"]}
          gridClassName="lg:grid-cols-[minmax(10rem,1.3fr)_minmax(8rem,1fr)_8rem_5rem_7rem_9rem]"
        >
          {invoices.map((invoice) => (
            <FinanceCompactRow
              key={invoice.invoiceId}
              gridClassName="lg:grid-cols-[minmax(10rem,1.3fr)_minmax(8rem,1fr)_8rem_5rem_7rem_9rem]"
            >
              <FinanceCell>
                <div className="flex items-start justify-between gap-3 lg:block">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {invoice.creditCardName}
                    </p>
                    <p className="mt-1 text-xs capitalize text-zinc-500 lg:hidden">
                      {formatMonth(invoice.referenceMonth)} · vence {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-sm font-semibold text-white tabular-nums lg:hidden">
                    {formatCurrency(invoice.totalAmount)}
                  </p>
                </div>
              </FinanceCell>
              <FinanceCell className="hidden text-sm capitalize text-zinc-400 lg:block">
                {formatMonth(invoice.referenceMonth)}
              </FinanceCell>
              <FinanceCell className="mt-2 text-xs text-zinc-500 lg:mt-0 lg:text-sm lg:text-zinc-400">
                {formatDate(invoice.dueDate)}
              </FinanceCell>
              <FinanceCell className="mt-1 text-xs text-zinc-500 lg:mt-0 lg:text-sm lg:text-zinc-400">
                {invoice.installmentCount}
              </FinanceCell>
              <FinanceCell className="mt-2 lg:mt-0">
                <FinanceStatusPill>
                  {statusLabel[invoice.status]}
                </FinanceStatusPill>
              </FinanceCell>
              <FinanceCell className="hidden text-right text-sm font-semibold text-white tabular-nums lg:block">
                {formatCurrency(invoice.totalAmount)}
              </FinanceCell>
            </FinanceCompactRow>
          ))}
        </FinanceCompactList>
      )}
    </Section>
  );
}
function Projection({ months }: { months: FinancialMonthlyProjection[] }) {
  return (
    <Section
      title="Compromissos dos próximos 3 meses"
      description="Soma lançamentos pendentes, parcelas já criadas e recorrências ainda não geradas, sem duplicar valores."
    >
      <FinanceCompactList
        columns={[
          "Mês",
          "Receitas",
          "Contas",
          "Cartões",
          "Recorrências",
          "Resultado",
        ]}
        gridClassName="lg:grid-cols-[minmax(9rem,1fr)_9rem_9rem_9rem_9rem_9rem]"
      >
        {months.map((month) => (
          <FinanceCompactRow
            key={month.referenceMonth}
            gridClassName="lg:grid-cols-[minmax(9rem,1fr)_9rem_9rem_9rem_9rem_9rem]"
          >
            <FinanceCell>
              <p className="text-sm font-medium capitalize text-white">
                {formatMonth(month.referenceMonth)}
              </p>
            </FinanceCell>
            <FinanceCell className="mt-2 text-xs text-emerald-300 tabular-nums lg:mt-0 lg:text-right lg:text-sm">
              {formatCurrency(month.expectedIncome)}
            </FinanceCell>
            <FinanceCell className="mt-1 text-xs text-zinc-400 tabular-nums lg:mt-0 lg:text-right lg:text-sm">
              {formatCurrency(month.accountExpenses)}
            </FinanceCell>
            <FinanceCell className="mt-1 text-xs text-zinc-400 tabular-nums lg:mt-0 lg:text-right lg:text-sm">
              {formatCurrency(month.creditCardExpenses)}
            </FinanceCell>
            <FinanceCell className="mt-1 text-xs text-zinc-400 tabular-nums lg:mt-0 lg:text-right lg:text-sm">
              {formatCurrency(month.recurrenceForecast)}
            </FinanceCell>
            <FinanceCell
              className={[
                "mt-2 text-sm font-semibold tabular-nums lg:mt-0 lg:text-right",
                month.projectedResult >= 0
                  ? "text-emerald-300"
                  : "text-rose-300",
              ].join(" ")}
            >
              {formatCurrency(month.projectedResult)}
            </FinanceCell>
          </FinanceCompactRow>
        ))}
      </FinanceCompactList>
    </Section>
  );
}
function Recurrences({ items }: { items: FinancialDashboardRecurrence[] }) {
  return (
    <Section title="Recorrências e assinaturas" description="Próximas gerações automáticas ativas.">
      {items.length === 0 ? (
        <Empty>Nenhuma recorrência ativa.</Empty>
      ) : (
        <div className="divide-y divide-white/[0.07]">
          {items.map((item) => (
            <article key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.055] text-zinc-400">
                <Repeat2 className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-200">{item.description}</p>
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {item.sourceName} · próxima em {formatDate(item.nextGenerationDate)}
                </p>
              </div>
              <p className={item.type === "INCOME" ? "text-sm font-semibold text-emerald-300" : "text-sm font-semibold text-rose-300"}>
                {formatCurrency(item.amount)}
              </p>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}

function Installments({ items }: { items: FinancialInstallmentCommitment[] }) {
  return (
    <Section title="Compras parceladas" description="Saldo que ainda compromete as próximas faturas.">
      {items.length === 0 ? (
        <Empty>Nenhuma compra parcelada ativa.</Empty>
      ) : (
        <div className="divide-y divide-white/[0.07]">
          {items.map((item) => (
            <article key={item.purchaseId} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">{item.description}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {item.creditCardName} · próxima {item.currentInstallment}/{item.totalInstallments}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-white">{formatCurrency(item.remainingAmount)}</p>
                  <p className="mt-1 text-xs text-zinc-500">{item.remainingInstallments} restante(s)</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}

function Budgets({ items }: { items: FinancialBudgetProgress[] }) {
  return (
    <Section title="Orçamentos" description="Consumo das metas do mês selecionado.">
      {items.length === 0 ? (
        <Empty>Nenhum orçamento criado para este mês.</Empty>
      ) : (
        <div className="space-y-5">
          {items.map((item) => (
            <article key={item.budgetId}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="truncate text-zinc-300">{item.categoryName}</span>
                <span className={item.status === "EXCEEDED" ? "text-rose-300" : item.status === "ALERT" ? "text-amber-200" : "text-zinc-400"}>
                  {formatCurrency(item.committedAmount)} / {formatCurrency(item.limitAmount)}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(item.consumptionPercentage, 100)}%` }} />
              </div>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}

function Upcoming({ items }: { items: FinancialUpcomingItem[] }) {
  return (
    <Section title="Próximos vencimentos" description="Contas e parcelas que pedem atenção primeiro.">
      {items.length === 0 ? (
        <Empty>Nenhum compromisso pendente no horizonte.</Empty>
      ) : (
        <div className="divide-y divide-white/[0.07]">
          {items.map((item) => (
            <article key={`${item.kind}-${item.id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className={item.overdue ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-400/10 text-rose-300" : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.055] text-zinc-400"}>
                <CalendarClock className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-200">{item.description}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.sourceName} · {formatDate(item.dueDate)}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-white">{formatCurrency(item.amount)}</p>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}

function DashboardSkeleton() {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/[0.035]" />)}</div>;
}

export function FinanceOverview() {
  const { dashboard, error, loading, refreshing, periodLabel, previousMonth, nextMonth, currentMonth, refresh } = useFinanceDashboard();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <button type="button" onClick={previousMonth} aria-label="Mês anterior" className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"><ArrowLeft className="size-4" /></button>
          <p className="min-w-40 text-center text-sm font-medium capitalize text-zinc-200">{periodLabel}</p>
          <button type="button" onClick={nextMonth} aria-label="Próximo mês" className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"><ArrowRight className="size-4" /></button>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={currentMonth} className="flex h-10 flex-1 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white sm:flex-none">Mês atual</button>
          <button type="button" onClick={() => void refresh()} disabled={refreshing} aria-label="Atualizar visão geral" className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"><RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} /></button>
        </div>
      </div>

      {loading ? <DashboardSkeleton /> : null}
      {!loading && error ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-[1.75rem] border border-rose-400/20 bg-rose-400/[0.04] p-6 text-center">
          <AlertCircle className="size-8 text-rose-300" />
          <h2 className="mt-4 font-semibold text-white">Não foi possível carregar as finanças</h2>
          <p className="mt-2 text-sm text-zinc-400">{error}</p>
          <button type="button" onClick={() => void refresh()} className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">Tentar novamente</button>
        </div>
      ) : null}
      {!loading && !error && !dashboard ? <div className="flex min-h-64 items-center justify-center"><LoaderCircle className="size-6 animate-spin text-zinc-500" /></div> : null}

      {!loading && !error && dashboard ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FinanceSummaryCard label="Saldo disponível" value={formatCurrency(dashboard.totalAccountBalance)} description="Saldo realizado das contas" icon={Wallet} />
            <FinanceSummaryCard label="Saldo projetado" value={formatCurrency(dashboard.projectedBalance)} description="Após compromissos pendentes do período" icon={TrendingUp} emphasis={dashboard.projectedBalance >= 0 ? "positive" : "negative"} />
            <FinanceSummaryCard label="Receitas realizadas" value={formatCurrency(dashboard.totalIncome)} description={`${formatCurrency(dashboard.pendingIncome)} a receber`} icon={ArrowUpRight} emphasis="positive" />
            <FinanceSummaryCard label="Despesas realizadas" value={formatCurrency(dashboard.totalExpense)} description={`${formatCurrency(dashboard.pendingExpense)} comprometidos`} icon={ArrowDownLeft} emphasis="negative" />
            <FinanceSummaryCard label="Resultado do período" value={formatCurrency(dashboard.periodBalance)} description="Receitas menos despesas realizadas" icon={Scale} emphasis={dashboard.periodBalance >= 0 ? "positive" : "negative"} />
            <FinanceSummaryCard label="Fatura atual" value={formatCurrency(dashboard.currentInvoiceAmount)} description="Cartões no mês selecionado" icon={CreditCard} />
            <FinanceSummaryCard label="Parcelamentos restantes" value={formatCurrency(dashboard.remainingInstallmentAmount)} description={`${dashboard.activeInstallmentPurchaseCount} compra(s) parcelada(s)`} icon={Layers3} />
            <FinanceSummaryCard label="Recorrências · 30 dias" value={formatCurrency(dashboard.recurringExpenseNext30Days)} description={`${dashboard.activeRecurrenceCount} recorrência(s) ativa(s)`} icon={Repeat2} />
          </div>

          {dashboard.overdueTransactionCount > 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.055] p-4 text-rose-200">
              <AlertCircle className="size-5 shrink-0" />
              <p className="text-sm"><strong>{dashboard.overdueTransactionCount}</strong> compromisso(s) vencido(s), totalizando <strong>{formatCurrency(dashboard.overdueExpense)}</strong>.</p>
            </div>
          ) : null}

          <Invoices invoices={dashboard.invoices} />
          <Projection months={dashboard.nextThreeMonths} />
          <div className="grid gap-5 xl:grid-cols-2"><Recurrences items={dashboard.recurrences} /><Installments items={dashboard.installmentCommitments} /></div>
          <div className="grid gap-5 xl:grid-cols-2"><Upcoming items={dashboard.upcomingItems} /><Budgets items={dashboard.budgets} /></div>
          <div className="grid gap-5 xl:grid-cols-2"><CategoryDistribution title="Receitas realizadas por categoria" categories={dashboard.incomeByCategory} /><CategoryDistribution title="Despesas realizadas por categoria" categories={dashboard.expenseByCategory} /></div>
        </>
      ) : null}
    </div>
  );
}
