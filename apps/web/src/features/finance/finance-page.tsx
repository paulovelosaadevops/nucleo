"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { FinanceAccounts } from "./finance-accounts";
import { FinanceBudgets } from "./finance-budgets";
import { FinanceCategories } from "./finance-categories";
import { FinanceCreditCards } from "./finance-credit-cards";
import { FinanceNavigation } from "./finance-navigation";
import { FinanceOverview } from "./finance-overview";
import { FinanceRecurrences } from "./finance-recurrences";
import { FinanceTransactions } from "./finance-transactions";

import type { FinanceSection } from "@/types/finance";

export function FinancePage() {
  const [activeSection, setActiveSection] =
    useState<FinanceSection>("overview");

  useEffect(() => {
    const parameters = new URLSearchParams(
      window.location.search,
    );

    if (parameters.get("novo") === "true") {
      setActiveSection("transactions");
    }
  }, []);

  function handleSectionChange(section: FinanceSection) {
    setActiveSection(section);

    const url = new URL(window.location.href);
    url.searchParams.delete("novo");

    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}`,
    );
  }

  function openNewTransaction() {
    const url = new URL(window.location.href);
    url.searchParams.set("novo", "true");

    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}`,
    );

    setActiveSection("transactions");
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            <span className="size-1.5 rounded-full bg-white" />
            Central familiar
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Finanças
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Contas, lançamentos, planejamento, recorrências e
            cartões do núcleo familiar.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewTransaction}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-black shadow-[0_15px_45px_rgba(255,255,255,0.12)] transition hover:bg-zinc-200"
        >
          <Plus className="size-4" />
          Novo lançamento
        </button>
      </header>

      <FinanceNavigation
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      {activeSection === "overview" ? (
        <FinanceOverview />
      ) : activeSection === "transactions" ? (
        <FinanceTransactions />
      ) : activeSection === "accounts" ? (
        <FinanceAccounts />
      ) : activeSection === "categories" ? (
        <FinanceCategories />
      ) : activeSection === "budgets" ? (
        <FinanceBudgets />
      ) : activeSection === "recurrences" ? (
        <FinanceRecurrences />
      ) : (
        <FinanceCreditCards />
      )}
    </div>
  );
}