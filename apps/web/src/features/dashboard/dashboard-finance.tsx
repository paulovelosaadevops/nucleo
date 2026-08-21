import { Surface } from "@/components/ui/surface";
import type { DashboardFinance } from "@/types/dashboard";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CircleAlert,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

interface DashboardFinanceProps {
  finance: DashboardFinance | null;
  unavailable?: boolean;
}

const currencyFormatter =
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export function DashboardFinance({
  finance,
  unavailable = false,
}: DashboardFinanceProps) {
  return (
    <Surface className="h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-600">
            Mês atual
          </p>

          <h2 className="mt-1 text-lg font-semibold text-white">
            Finanças
          </h2>
        </div>

        <Link
          href="/financas"
          className="flex items-center gap-1 text-xs font-medium text-zinc-500 transition hover:text-white"
        >
          Ver finanças
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {unavailable || !finance ? (
        <div className="flex min-h-44 flex-col items-center justify-center text-center">
          <WalletCards className="h-6 w-6 text-zinc-700" />

          <p className="mt-3 text-sm text-zinc-600">
            Resumo financeiro indisponível.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/25 p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.12em] text-zinc-600">
              Saldo das contas
            </p>

            <p className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
              {currencyFormatter.format(
                finance.totalAccountBalance,
              )}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <FinancialValue
              label="Receitas"
              value={finance.totalIncome}
              icon={ArrowUpRight}
            />

            <FinancialValue
              label="Despesas"
              value={finance.totalExpense}
              icon={ArrowDownRight}
            />
          </div>

          {finance.overdueTransactionCount > 0 && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-red-400/15 bg-red-400/[0.055] p-3 text-red-200">
              <CircleAlert className="h-4 w-4 shrink-0" />

              <p className="text-xs">
                {finance.overdueTransactionCount}{" "}
                {finance.overdueTransactionCount === 1
                  ? "despesa vencida"
                  : "despesas vencidas"}
                {" · "}
                {currencyFormatter.format(
                  finance.overdueExpense,
                )}
              </p>
            </div>
          )}
        </>
      )}
    </Surface>
  );
}

interface FinancialValueProps {
  label: string;
  value: number;
  icon: typeof ArrowUpRight;
}

function FinancialValue({
  label,
  value,
  icon: Icon,
}: FinancialValueProps) {
  return (
    <div className="rounded-2xl border border-white/[0.065] bg-white/[0.025] p-3">
      <div className="flex items-center gap-1.5 text-zinc-600">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[0.65rem]">
          {label}
        </span>
      </div>

      <p className="mt-2 truncate text-sm font-medium text-zinc-300">
        {currencyFormatter.format(value)}
      </p>
    </div>
  );
}