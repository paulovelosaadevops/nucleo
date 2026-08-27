"use client";

import {
  ChartNoAxesCombined,
  CreditCard,
  FolderTree,
  Landmark,
  ListRestart,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import type { FinanceSection } from "@/types/finance";

interface FinanceNavigationProps {
  activeSection: FinanceSection;
  onSectionChange: (section: FinanceSection) => void;
}

const items: Array<{
  value: FinanceSection;
  label: string;
  icon: typeof ChartNoAxesCombined;
}> = [
  {
    value: "overview",
    label: "Visão geral",
    icon: ChartNoAxesCombined,
  },
  {
    value: "transactions",
    label: "Lançamentos",
    icon: ReceiptText,
  },
  {
    value: "accounts",
    label: "Contas",
    icon: Landmark,
  },
  {
    value: "categories",
    label: "Categorias",
    icon: FolderTree,
  },
  {
    value: "budgets",
    label: "Orçamentos",
    icon: WalletCards,
  },
  {
    value: "recurrences",
    label: "Recorrências",
    icon: ListRestart,
  },
  {
    value: "credit-cards",
    label: "Cartões",
    icon: CreditCard,
  },
  {
    value: "investments",
    label: "Investimentos",
    icon: TrendingUp,
  },
];

export function FinanceNavigation({
  activeSection,
  onSectionChange,
}: FinanceNavigationProps) {
  return (
    <nav
      aria-label="Navegação financeira"
      className="overflow-x-auto pb-1"
    >
      <div className="flex min-w-max gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.value;

          return (
            <button
              key={item.value}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onSectionChange(item.value)}
              className={[
                "inline-flex h-11 items-center gap-2 rounded-2xl border px-4",
                "text-sm font-medium transition-all duration-200",
                active
                  ? "border-white bg-white text-black shadow-[0_12px_40px_rgba(255,255,255,0.12)]"
                  : "border-white/10 bg-white/[0.035] text-zinc-400 hover:border-white/20 hover:bg-white/[0.07] hover:text-white",
              ].join(" ")}
            >
              <Icon
                aria-hidden="true"
                className="size-4 shrink-0"
              />

              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
