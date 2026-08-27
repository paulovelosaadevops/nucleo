import { Surface } from "@/components/ui/surface";
import type { DashboardFinance as DashboardFinanceData } from "@/types/dashboard";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CircleAlert,
  CreditCard,
  Repeat2,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

interface DashboardFinanceProps {
  finance: DashboardFinanceData | null;
  unavailable?: boolean;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
});

function localDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

export function DashboardFinance({
  finance,
  unavailable = false,
}: DashboardFinanceProps) {
  return (
    <Surface className="h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-600">Mês atual</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Finanças</h2>
        </div>
        <Link
          href="/financas"
          className="flex items-center gap-1 text-xs font-medium text-zinc-500 transition hover:text-white"
        >
          Ver visão geral
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {unavailable || !finance ? (
        <div className="flex min-h-44 flex-col items-center justify-center text-center">
          <WalletCards className="h-6 w-6 text-zinc-700" />
          <p className="mt-3 text-sm text-zinc-600">Resumo financeiro indisponível.</p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/[0.07] bg-black/25 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.12em] text-zinc-600">Saldo disponÃ­vel</p>
              <p className="mt-2 truncate text-xl font-semibold tracking-[-0.035em] text-white">
                {currencyFormatter.format(finance.availableAccountBalance)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-black/25 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.12em] text-zinc-600">Após pendências</p>
              <p className={finance.projectedBalance >= 0 ? "mt-2 truncate text-xl font-semibold text-emerald-300" : "mt-2 truncate text-xl font-semibold text-rose-300"}>
                {currencyFormatter.format(finance.projectedBalance)}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <FinancialValue label="Receitas" value={finance.totalIncome} icon={ArrowUpRight} />
            <FinancialValue label="Despesas" value={finance.totalExpense} icon={ArrowDownRight} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <FinancialValue label="Fatura atual" value={finance.currentInvoiceAmount} icon={CreditCard} />
            <FinancialValue label="Recorrências · 30d" value={finance.recurringExpenseNext30Days} icon={Repeat2} />
          </div>

          {finance.upcomingInvoices.length > 0 ? (
            <div className="mt-3 rounded-2xl border border-white/[0.065] bg-white/[0.025] p-3">
              <div className="flex items-center gap-2 text-zinc-500">
                <CalendarClock className="size-3.5" />
                <p className="text-[0.68rem] uppercase tracking-[0.1em]">Próximas faturas</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {finance.upcomingInvoices.map((month) => (
                  <div key={month.referenceMonth} className="min-w-0">
                    <p className="truncate text-[0.65rem] capitalize text-zinc-600">
                      {monthFormatter.format(localDate(month.referenceMonth))}
                    </p>
                    <p className="mt-1 truncate text-xs font-medium text-zinc-300">
                      {currencyFormatter.format(month.totalAmount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {finance.overdueTransactionCount > 0 ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-red-400/15 bg-red-400/[0.055] p-3 text-red-200">
              <CircleAlert className="h-4 w-4 shrink-0" />
              <p className="text-xs">
                {finance.overdueTransactionCount} vencido(s) · {currencyFormatter.format(finance.overdueExpense)}
              </p>
            </div>
          ) : null}
        </>
      )}
    </Surface>
  );
}

function FinancialValue({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof ArrowUpRight;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.065] bg-white/[0.025] p-3">
      <div className="flex items-center gap-1.5 text-zinc-600">
        <Icon className="h-3.5 w-3.5" />
        <span className="truncate text-[0.65rem]">{label}</span>
      </div>
      <p className="mt-2 truncate text-sm font-medium text-zinc-300">
        {currencyFormatter.format(value)}
      </p>
    </div>
  );
}
