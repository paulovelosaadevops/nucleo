"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarSync,
  LoaderCircle,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { financeService } from "./finance-service";
import {
  confirmDialog,
  promptDialog,
} from "@/lib/feedback";
import {
  FinanceCell,
  FinanceCompactList,
  FinanceCompactRow,
  FinanceStatusPill,
} from "./finance-compact-list";
import { FinancialRecurrenceForm } from "./financial-recurrence-form";

import type {
  CreateFinancialRecurrenceRequest,
  FinancialAccount,
  FinancialCategory,
  FinancialCreditCard,
  FinancialRecurrence,
  FinancialRecurrenceOccurrence,
  FinancialRecurrenceFrequency,
  UpdateFinancialRecurrenceRequest,
} from "@/types/finance";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const frequencyLabels: Record<
  FinancialRecurrenceFrequency,
  string
> = {
  DAILY: "Diária",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${value}T00:00:00`),
  );
}

function todayAsInputValue() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

export function FinanceRecurrences() {
  const [recurrences, setRecurrences] = useState<
    FinancialRecurrence[]
  >([]);
  const [occurrences, setOccurrences] = useState<
    FinancialRecurrenceOccurrence[]
  >([]);

  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<
    FinancialCategory[]
  >([]);
  const [creditCards, setCreditCards] = useState<FinancialCreditCard[]>([]);

  const [editing, setEditing] =
    useState<FinancialRecurrence | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadRecurrences = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [recurrenceResult, occurrenceResult] = await Promise.all([
        financeService.recurrences.list(),
        financeService.recurrences.occurrences(true),
      ]);

      setRecurrences(recurrenceResult);
      setOccurrences(occurrenceResult);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar as recorrências.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([
      financeService.accounts.list(),
      financeService.categories.list(),
      financeService.creditCards.list(),
    ])
      .then(([accountResult, categoryResult, creditCardResult]) => {
        if (!active) {
          return;
        }

        setAccounts(accountResult);
        setCategories(categoryResult);
        setCreditCards(creditCardResult);
      })
      .catch((requestError: unknown) => {
        if (!active) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar contas, categorias e cartões.",
        );
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([
      financeService.recurrences.list(),
      financeService.recurrences.occurrences(true),
    ])
      .then(([recurrenceResult, occurrenceResult]) => {
        if (!active) {
          return;
        }

        setRecurrences(recurrenceResult);
        setOccurrences(occurrenceResult);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (!active) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar as recorrências.",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(
    request:
      | CreateFinancialRecurrenceRequest
      | UpdateFinancialRecurrenceRequest,
  ) {
    setSubmitting(true);

    try {
      if (editing) {
        await financeService.recurrences.update(
          editing.id,
          request as UpdateFinancialRecurrenceRequest,
        );
      } else {
        await financeService.recurrences.create(
          request as CreateFinancialRecurrenceRequest,
        );
      }

      setFormOpen(false);
      setEditing(null);
      await loadRecurrences();
    } finally {
      setSubmitting(false);
    }
  }

  async function executeAction(
    recurrenceId: string,
    action: () => Promise<FinancialRecurrence | void>,
  ) {
    setActionId(recurrenceId);
    setError(null);
    setMessage(null);

    try {
      await action();
      await loadRecurrences();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível realizar a ação.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function generateTransactions() {
    const until = await promptDialog({
      title: "Gerar recorrencias",
      description: "Gerar lancamentos ate qual data?",
      label: "Data limite",
      type: "date",
      defaultValue: todayAsInputValue(),
      confirmLabel: "Gerar",
    });

    if (until === null) {
      return;
    }

    setGenerating(true);
    setError(null);
    setMessage(null);

    try {
      const result =
        await financeService.recurrences.generate(
          until || undefined,
        );

      setMessage(
        `${result.processedRecurrences} recorrencia(s) processada(s). As cobrancas vencidas agora aguardam confirmacao do valor real.`,
      );

      await loadRecurrences();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível gerar os lançamentos.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function removeRecurrence(recurrence: FinancialRecurrence) {
    const confirmed = await confirmDialog({
      title: "Excluir recorrencia",
      description: `Deseja excluir a recorrencia "${recurrence.description}"? Os lancamentos ja gerados serao preservados.`,
      confirmLabel: "Excluir",
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    void executeAction(recurrence.id, () =>
      financeService.recurrences.remove(recurrence.id),
    );
  }

  async function confirmOccurrence(occurrence: FinancialRecurrenceOccurrence) {
    const value = await promptDialog({
      title: "Confirmar valor",
      description: `Informe o valor real de ${occurrence.description}.`,
      label: "Valor real",
      defaultValue: String(occurrence.estimatedAmount),
      inputMode: "decimal",
      confirmLabel: "Continuar",
    });

    if (value === null) return;

    const amount = Number(value.replace(",", "."));

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Informe um valor real maior que zero.");
      return;
    }

    const chargedDate = await promptDialog({
      title: "Data da cobranca",
      description: "Informe a data real da cobranca.",
      label: "Data da cobranca",
      type: "date",
      defaultValue: occurrence.scheduledDate,
      confirmLabel: "Continuar",
    });

    if (!chargedDate) return;

    const notes = await promptDialog({
      title: "Observacao",
      description: "Inclua uma observacao opcional.",
      label: "Observacao",
      defaultValue: occurrence.notes ?? "",
      confirmLabel: "Confirmar",
    });

    setActionId(occurrence.id);
    setError(null);
    setMessage(null);

    try {
      await financeService.recurrences.confirmOccurrence(occurrence.id, {
        amount,
        chargedDate,
        categoryId: occurrence.categoryId,
        accountId: occurrence.accountId,
        creditCardId: occurrence.creditCardId,
        paymentMethod: occurrence.paymentMethod,
        notes: notes || null,
      });
      setMessage("Valor confirmado e lancamento criado.");
      await loadRecurrences();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel confirmar a pendencia.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function skipOccurrence(occurrence: FinancialRecurrenceOccurrence) {
    const confirmed = await confirmDialog({
      title: "Ignorar cobranca",
      description: `Nao havera cobranca de ${occurrence.description} neste mes?`,
      confirmLabel: "Ignorar",
    });

    if (!confirmed) return;

    setActionId(occurrence.id);
    setError(null);
    setMessage(null);

    try {
      await financeService.recurrences.skipOccurrence(occurrence.id, {
        notes: "Sem cobranca neste mes.",
      });
      setMessage("Mes ignorado sem gerar lancamento.");
      await loadRecurrences();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel ignorar a pendencia.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function postponeOccurrence(occurrence: FinancialRecurrenceOccurrence) {
    const reminderDate = await promptDialog({
      title: "Adiar lembrete",
      description: "Adiar lembrete para qual data?",
      label: "Nova data",
      type: "date",
      defaultValue: occurrence.reminderDate ?? occurrence.scheduledDate,
      confirmLabel: "Adiar",
    });

    if (!reminderDate) return;

    setActionId(occurrence.id);
    setError(null);
    setMessage(null);

    try {
      await financeService.recurrences.postponeOccurrence(occurrence.id, {
        reminderDate,
      });
      setMessage("Lembrete adiado.");
      await loadRecurrences();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel adiar o lembrete.",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold text-white">
            Recorrências
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Automatize receitas e despesas repetitivas
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={generating}
            onClick={() => void generateTransactions()}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-50 sm:flex-none"
          >
            {generating ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Gerar
          </button>

          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-black sm:flex-none"
          >
            <Plus className="size-4" />
            Nova
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="flex gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-4 text-sm text-rose-200">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-60 items-center justify-center rounded-[1.75rem] border border-white/10">
          <LoaderCircle className="size-6 animate-spin text-zinc-500" />
        </div>
      ) : null}

      {!loading && occurrences.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Pendencias de valor real
              </h3>
              <p className="text-xs text-zinc-500">
                Confirme o valor antes de entrar na conta ou fatura.
              </p>
            </div>
            <FinanceStatusPill tone="warning">
              {occurrences.length}
            </FinanceStatusPill>
          </div>

          <div className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
            {occurrences.map((occurrence) => (
              <div
                key={occurrence.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {occurrence.description}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {occurrence.categoryName ?? "Sem categoria"} ·{" "}
                    {occurrence.creditCardName ??
                      occurrence.accountName ??
                      "Sem origem"}{" "}
                    · {formatDate(occurrence.scheduledDate)} · ref.{" "}
                    {formatDate(occurrence.referenceMonth)}
                  </p>
                </div>

                <p className="text-sm font-semibold tabular-nums text-zinc-200">
                  {currencyFormatter.format(occurrence.estimatedAmount)}
                </p>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    disabled={actionId === occurrence.id}
                    onClick={() => void confirmOccurrence(occurrence)}
                    className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
                  >
                    Confirmar valor
                  </button>
                  <button
                    type="button"
                    disabled={actionId === occurrence.id}
                    onClick={() => void skipOccurrence(occurrence)}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 disabled:opacity-50"
                  >
                    Sem cobranca
                  </button>
                  <button
                    type="button"
                    disabled={actionId === occurrence.id}
                    onClick={() => void postponeOccurrence(occurrence)}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 disabled:opacity-50"
                  >
                    Adiar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && recurrences.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 p-6 text-center">
          <CalendarSync className="size-8 text-zinc-600" />

          <p className="mt-4 font-medium text-zinc-300">
            Nenhuma recorrência cadastrada
          </p>

          <p className="mt-2 max-w-md text-sm text-zinc-600">
            Cadastre despesas fixas, salários e outros
            lançamentos repetitivos.
          </p>
        </div>
      ) : null}

      {!loading && recurrences.length > 0 ? (
        <FinanceCompactList
          columns={[
            "Nome",
            "Origem",
            "Categoria",
            "Frequência",
            "Valor",
            "Próxima",
            "Restantes",
            "Situação",
            "Ações",
          ]}
          gridClassName="lg:grid-cols-[minmax(12rem,1.4fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_8rem_9rem_8rem_7rem_7rem_9rem]"
        >
          {recurrences.map((recurrence) => {
            const processing = actionId === recurrence.id;
            const amountClass =
              recurrence.type === "INCOME"
                ? "text-emerald-300"
                : "text-rose-300";

            return (
              <FinanceCompactRow
                key={recurrence.id}
                gridClassName="lg:grid-cols-[minmax(12rem,1.4fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_8rem_9rem_8rem_7rem_7rem_9rem]"
                className={
                  recurrence.active
                    ? undefined
                    : "bg-white/[0.012] opacity-70"
                }
              >
                <FinanceCell>
                  <div className="flex items-start justify-between gap-3 lg:block">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {recurrence.description}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 lg:hidden">
                        {recurrence.creditCardName ?? recurrence.accountName}
                        {" · "}
                        {frequencyLabels[recurrence.frequency]}
                      </p>
                    </div>
                    <p className={`shrink-0 text-right text-sm font-semibold tabular-nums lg:hidden ${amountClass}`}>
                      {currencyFormatter.format(recurrence.amount)}
                    </p>
                  </div>
                </FinanceCell>

                <FinanceCell className="mt-2 text-xs text-zinc-500 lg:mt-0 lg:text-sm lg:text-zinc-400">
                  {recurrence.creditCardName ?? recurrence.accountName ?? "Sem origem"}
                </FinanceCell>

                <FinanceCell className="mt-1 text-xs text-zinc-500 lg:mt-0 lg:text-sm lg:text-zinc-400">
                  {recurrence.categoryName ?? "Sem categoria"}
                </FinanceCell>

                <FinanceCell className="mt-1 text-xs text-zinc-500 lg:mt-0 lg:text-sm lg:text-zinc-400">
                  {frequencyLabels[recurrence.frequency]}
                  {recurrence.interval > 1 ? ` / ${recurrence.interval}` : ""}
                </FinanceCell>

                <FinanceCell className={`hidden text-right text-sm font-semibold tabular-nums lg:block ${amountClass}`}>
                  {currencyFormatter.format(recurrence.amount)}
                </FinanceCell>

                <FinanceCell className="mt-2 text-xs text-zinc-500 lg:mt-0 lg:text-sm lg:text-zinc-400">
                  {formatDate(recurrence.nextGenerationDate)}
                </FinanceCell>

                <FinanceCell className="mt-1 text-xs text-zinc-500 lg:mt-0 lg:text-sm lg:text-zinc-400">
                  {recurrence.remainingOccurrences ?? "Sem limite"}
                </FinanceCell>

                <FinanceCell className="mt-2 lg:mt-0">
                  <FinanceStatusPill tone={recurrence.active ? "positive" : "warning"}>
                    {recurrence.active ? "Ativa" : "Pausada"}
                  </FinanceStatusPill>
                </FinanceCell>

                <FinanceCell className="mt-3 lg:mt-0">
                  {processing ? (
                    <div className="flex size-9 items-center justify-end">
                      <LoaderCircle className="size-4 animate-spin text-zinc-500" />
                    </div>
                  ) : (
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title="Editar"
                        aria-label="Editar recorrência"
                        onClick={() => {
                          setEditing(recurrence);
                          setFormOpen(true);
                        }}
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="size-4" />
                      </button>

                      <button
                        type="button"
                        title={recurrence.active ? "Pausar" : "Retomar"}
                        aria-label={recurrence.active ? "Pausar recorrência" : "Retomar recorrência"}
                        onClick={() =>
                          void executeAction(
                            recurrence.id,
                            () =>
                              recurrence.active
                                ? financeService.recurrences.pause(recurrence.id)
                                : financeService.recurrences.resume(recurrence.id),
                          )
                        }
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/10 hover:text-white"
                      >
                        {recurrence.active ? (
                          <Pause className="size-4" />
                        ) : (
                          <Play className="size-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        title="Excluir"
                        aria-label="Excluir recorrência"
                        onClick={() => removeRecurrence(recurrence)}
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-rose-400/10 hover:text-rose-300"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )}
                </FinanceCell>
              </FinanceCompactRow>
            );
          })}
        </FinanceCompactList>
      ) : null}
      {formOpen ? (
        <FinancialRecurrenceForm
          key={editing?.id ?? "new-recurrence"}
          recurrence={editing}
          accounts={accounts}
          categories={categories}
          creditCards={creditCards}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => {
            if (!submitting) {
              setFormOpen(false);
              setEditing(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
