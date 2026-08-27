"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Eye,
  LoaderCircle,
  Plus,
  RefreshCw,
} from "lucide-react";

import { ModalShell } from "@/components/ui/modal-shell";

import { financeService } from "./finance-service";
import { FinanceSummaryCard } from "./finance-summary-card";

import type {
  CreateFinancialInvestmentRequest,
  FinancialAccount,
  FinancialInvestment,
  FinancialInvestmentModality,
  InvestmentTransferRequest,
  ReconcileInvestmentRequest,
} from "@/types/finance";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

const modalityLabels: Record<FinancialInvestmentModality, string> = {
  PERCENT_CDI: "% do CDI",
  CDI_PLUS: "CDI + taxa",
  PERCENT_SELIC: "% da Selic",
  FIXED_RATE: "Prefixado",
  IPCA_PLUS: "IPCA + taxa",
  SAVINGS: "Poupanca",
  MANUAL: "Manual",
  NO_YIELD: "Sem rendimento",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value: number) {
  return currencyFormatter.format(value);
}

function percent(value: number) {
  return `${percentageFormatter.format(value)}%`;
}

function isAvailableAccount(account: FinancialAccount) {
  return account.active && account.type !== "INVESTMENT";
}

interface TransferModalState {
  kind: "contribute" | "redeem";
  investment: FinancialInvestment;
}

export function FinanceInvestments() {
  const [investments, setInvestments] = useState<FinancialInvestment[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "details" | "reconcile" | null>(null);
  const [selected, setSelected] = useState<FinancialInvestment | null>(null);
  const [transfer, setTransfer] = useState<TransferModalState | null>(null);

  const summary = useMemo(() => {
    const invested = investments.reduce((total, item) => total + item.currentBalance, 0);
    const gain = investments.reduce((total, item) => total + item.accumulatedYield, 0);
    const estimated = investments.some((item) => item.valuationStatus === "ESTIMATED");
    return { invested, gain, estimated };
  }, [investments]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [investmentItems, accountItems] = await Promise.all([
        financeService.investments.list(),
        financeService.accounts.list(),
      ]);
      setInvestments(investmentItems);
      setAccounts(accountItems);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Nao foi possivel carregar os investimentos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function replaceInvestment(updated: FinancialInvestment) {
    setInvestments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelected(updated);
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const request: CreateFinancialInvestmentRequest = {
      name: String(form.get("name") ?? ""),
      institution: String(form.get("institution") ?? ""),
      modality: String(form.get("modality") ?? "PERCENT_CDI") as FinancialInvestmentModality,
      startDate: String(form.get("startDate") ?? today()),
      initialAmount: Number(form.get("initialAmount") ?? 0),
      maturityDate: String(form.get("maturityDate") ?? "") || null,
      liquidity: String(form.get("liquidity") ?? "") || null,
      benchmarkPercentage: Number(form.get("benchmarkPercentage") || 0) || null,
      annualFixedRate: Number(form.get("annualFixedRate") || 0) || null,
      annualSpreadRate: Number(form.get("annualSpreadRate") || 0) || null,
      taxExempt: form.get("taxExempt") === "on",
      autoCalculate: form.get("autoCalculate") === "on",
      accrualStartRule: "NEXT_BUSINESS_DAY",
      notes: String(form.get("notes") ?? "") || null,
    };
    try {
      const created = await financeService.investments.create(request);
      setInvestments((current) => [created, ...current]);
      setModal(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Nao foi possivel cadastrar o investimento.");
    } finally {
      setSaving(false);
    }
  }

  async function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!transfer) return;
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const request: InvestmentTransferRequest = {
      accountId: String(form.get("accountId") ?? ""),
      amount: Number(form.get("amount") ?? 0),
      date: String(form.get("date") ?? today()),
      notes: String(form.get("notes") ?? "") || null,
    };
    try {
      const updated = transfer.kind === "contribute"
        ? await financeService.investments.contribute(transfer.investment.id, request)
        : await financeService.investments.redeem(transfer.investment.id, request);
      replaceInvestment(updated);
      setTransfer(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Nao foi possivel registrar a movimentacao.");
    } finally {
      setSaving(false);
    }
  }

  async function submitReconcile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const request: ReconcileInvestmentRequest = {
      realBalance: Number(form.get("realBalance") ?? 0),
      referenceDate: String(form.get("referenceDate") ?? today()),
      notes: String(form.get("notes") ?? "") || null,
    };
    try {
      replaceInvestment(await financeService.investments.reconcile(selected.id, request));
      setModal("details");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Nao foi possivel conciliar o investimento.");
    } finally {
      setSaving(false);
    }
  }

  const availableAccounts = accounts.filter(isAvailableAccount);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Investimentos</h2>
          <p className="mt-1 text-sm text-zinc-500">Aportes, resgates, rendimento estimado e conciliacao manual.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void load()} className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white">
            <RefreshCw className="size-4" />
          </button>
          <button type="button" onClick={() => setModal("create")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200">
            <Plus className="size-4" />
            Novo investimento
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.04] p-4 text-sm text-rose-200">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <FinanceSummaryCard label="Patrimonio investido" value={money(summary.invested)} description={summary.estimated ? "Estimado" : "Conciliado"} icon={CheckCircle2} />
        <FinanceSummaryCard label="Rendimento acumulado" value={money(summary.gain)} description="Nao inclui estimativa tributaria definitiva" icon={ArrowUpFromLine} emphasis={summary.gain >= 0 ? "positive" : "negative"} />
        <FinanceSummaryCard label="Produtos ativos" value={String(investments.filter((item) => item.currentBalance > 0).length)} description={`${investments.length} investimento(s) cadastrados`} icon={Eye} />
      </div>

      {loading ? (
        <div className="flex min-h-60 items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/[0.035]">
          <LoaderCircle className="size-6 animate-spin text-zinc-500" />
        </div>
      ) : investments.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.025] p-6 text-center">
          <p className="text-sm font-medium text-zinc-200">Nenhum investimento cadastrado.</p>
          <p className="mt-2 max-w-md text-sm text-zinc-500">Cadastre uma caixinha, CDB ou aplicacao manual para acompanhar patrimonio investido separado do saldo disponivel.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035]">
          <div className="divide-y divide-white/[0.07]">
            {investments.map((investment) => (
              <article key={investment.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => { setSelected(investment); setModal("details"); }} className="min-w-0 text-left">
                  <p className="truncate text-sm font-semibold text-white">{investment.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {investment.institution} - {modalityLabels[investment.modality]} - {investment.valuationStatus === "ESTIMATED" ? "Estimado" : "Conciliado"}
                  </p>
                </button>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-white">{money(investment.currentBalance)}</p>
                    <p className={investment.accumulatedReturnPercentage >= 0 ? "mt-1 text-xs text-emerald-300" : "mt-1 text-xs text-rose-300"}>
                      {percent(investment.accumulatedReturnPercentage)}
                    </p>
                  </div>
                  <button type="button" onClick={() => setTransfer({ kind: "contribute", investment })} className="flex size-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:bg-white/[0.06] hover:text-white" aria-label="Aportar">
                    <ArrowDownToLine className="size-4" />
                  </button>
                  <button type="button" onClick={() => setTransfer({ kind: "redeem", investment })} className="flex size-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:bg-white/[0.06] hover:text-white" aria-label="Resgatar">
                    <ArrowUpFromLine className="size-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {modal === "create" ? (
        <InvestmentFormModal busy={saving} onClose={() => setModal(null)} onSubmit={submitCreate} />
      ) : null}

      {transfer ? (
        <TransferModal
          busy={saving}
          state={transfer}
          accounts={availableAccounts}
          onClose={() => setTransfer(null)}
          onSubmit={submitTransfer}
        />
      ) : null}

      {modal === "details" && selected ? (
        <DetailsModal
          investment={selected}
          onClose={() => setModal(null)}
          onReconcile={() => setModal("reconcile")}
        />
      ) : null}

      {modal === "reconcile" && selected ? (
        <ReconcileModal
          busy={saving}
          investment={selected}
          onClose={() => setModal("details")}
          onSubmit={submitReconcile}
        />
      ) : null}
    </div>
  );
}

function InvestmentFormModal({ busy, onClose, onSubmit }: { busy: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; }) {
  return (
    <ModalShell eyebrow="Investimentos" title="Novo investimento" titleId="investment-create-title" busy={busy} onClose={onClose}>
      <form onSubmit={onSubmit} className="grid gap-4 overflow-y-auto p-5 sm:grid-cols-2 sm:p-7">
        <input name="name" required placeholder="Nome" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        <input name="institution" required placeholder="Instituicao" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        <select name="modality" defaultValue="PERCENT_CDI" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white">
          {Object.entries(modalityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input name="startDate" type="date" required defaultValue={today()} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        <input name="initialAmount" type="number" min="0" step="0.01" placeholder="Valor inicial" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        <input name="benchmarkPercentage" type="number" min="0" step="0.0001" placeholder="% CDI/Selic" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        <input name="annualFixedRate" type="number" step="0.0001" placeholder="Taxa prefixada a.a." className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        <input name="annualSpreadRate" type="number" step="0.0001" placeholder="Spread a.a." className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        <input name="liquidity" placeholder="Liquidez" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        <input name="maturityDate" type="date" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        <label className="flex items-center gap-2 text-sm text-zinc-300"><input name="autoCalculate" type="checkbox" defaultChecked /> Calculo automatico</label>
        <label className="flex items-center gap-2 text-sm text-zinc-300"><input name="taxExempt" type="checkbox" /> Isento de IR</label>
        <textarea name="notes" placeholder="Observacoes" className="min-h-24 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white sm:col-span-2" />
        <div className="flex justify-end gap-2 border-t border-white/10 pt-4 sm:col-span-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300">Cancelar</button>
          <button type="submit" disabled={busy} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">Salvar</button>
        </div>
      </form>
    </ModalShell>
  );
}

function TransferModal({ busy, state, accounts, onClose, onSubmit }: { busy: boolean; state: TransferModalState; accounts: FinancialAccount[]; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; }) {
  const contribution = state.kind === "contribute";
  return (
    <ModalShell eyebrow="Investimentos" title={contribution ? "Registrar aporte" : "Registrar resgate"} titleId="investment-transfer-title" busy={busy} size="small" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4 p-5 sm:p-7">
        <p className="text-sm text-zinc-400">{state.investment.name}</p>
        <select name="accountId" required className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white">
          <option value="">{contribution ? "Conta de origem" : "Conta de destino"}</option>
          {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
        </select>
        <input name="amount" type="number" min="0.01" step="0.01" required placeholder="Valor" className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        <input name="date" type="date" required defaultValue={today()} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        <textarea name="notes" placeholder="Observacoes" className="min-h-20 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300">Cancelar</button>
          <button type="submit" disabled={busy} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">Confirmar</button>
        </div>
      </form>
    </ModalShell>
  );
}

function DetailsModal({ investment, onClose, onReconcile }: { investment: FinancialInvestment; onClose: () => void; onReconcile: () => void; }) {
  return (
    <ModalShell eyebrow="Investimentos" title={investment.name} titleId="investment-details-title" onClose={onClose}>
      <div className="overflow-y-auto p-5 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-zinc-400">{investment.institution} - {modalityLabels[investment.modality]}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{money(investment.currentBalance)}</p>
            <p className="mt-1 text-xs text-zinc-500">{investment.valuationStatus === "ESTIMATED" ? "Estimado" : "Conciliado"}</p>
          </div>
          <button type="button" onClick={onReconcile} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200 hover:bg-white/[0.06]">Conciliar saldo</button>
        </div>
        <div className="mt-6 divide-y divide-white/[0.07]">
          {investment.movements.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Nenhuma movimentacao registrada.</p>
          ) : investment.movements.map((movement) => (
            <div key={movement.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200">{movement.movementType.replaceAll("_", " ")}</p>
                <p className="mt-1 text-xs text-zinc-500">{movement.movementDate}{movement.notes ? ` - ${movement.notes}` : ""}</p>
              </div>
              <p className={movement.amount >= 0 ? "shrink-0 text-sm font-semibold text-emerald-300" : "shrink-0 text-sm font-semibold text-rose-300"}>{money(movement.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

function ReconcileModal({ busy, investment, onClose, onSubmit }: { busy: boolean; investment: FinancialInvestment; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; }) {
  return (
    <ModalShell eyebrow="Investimentos" title="Conciliar saldo" titleId="investment-reconcile-title" busy={busy} size="small" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4 p-5 sm:p-7">
        <p className="text-sm text-zinc-400">{investment.name} - saldo calculado {money(investment.currentBalance)}</p>
        <input name="realBalance" type="number" min="0" step="0.01" required defaultValue={investment.currentBalance.toFixed(2)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        <input name="referenceDate" type="date" required defaultValue={today()} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        <textarea name="notes" placeholder="Observacoes" className="min-h-20 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300">Cancelar</button>
          <button type="submit" disabled={busy} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">Conciliar</button>
        </div>
      </form>
    </ModalShell>
  );
}
