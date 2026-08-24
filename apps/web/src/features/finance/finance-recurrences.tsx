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
import { FinancialRecurrenceForm } from "./financial-recurrence-form";

import type {
  CreateFinancialRecurrenceRequest,
  FinancialAccount,
  FinancialCategory,
  FinancialCreditCard,
  FinancialRecurrence,
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
      setRecurrences(
        await financeService.recurrences.list(),
      );
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

    financeService.recurrences
      .list()
      .then((response) => {
        if (!active) {
          return;
        }

        setRecurrences(response);
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
    const until = window.prompt(
      "Gerar lançamentos até qual data?",
      todayAsInputValue(),
    );

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
        `${result.createdTransactions} lançamento(s) em conta e ${result.createdCreditCardPurchases} compra(s) no cartão criados a partir de ${result.processedRecurrences} recorrência(s).`,
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

  function removeRecurrence(recurrence: FinancialRecurrence) {
    const confirmed = window.confirm(
      `Deseja excluir a recorrência "${recurrence.description}"? Os lançamentos já gerados serão preservados.`,
    );

    if (!confirmed) {
      return;
    }

    void executeAction(recurrence.id, () =>
      financeService.recurrences.remove(recurrence.id),
    );
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
        <div className="grid gap-3 lg:grid-cols-2">
          {recurrences.map((recurrence) => {
            const processing = actionId === recurrence.id;

            return (
              <article
                key={recurrence.id}
                className={[
                  "rounded-[1.5rem] border p-5 transition",
                  recurrence.active
                    ? "border-white/10 bg-white/[0.035]"
                    : "border-white/[0.06] bg-white/[0.015] opacity-65",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={[
                        "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                        recurrence.type === "INCOME"
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-rose-400/10 text-rose-300",
                      ].join(" ")}
                    >
                      <CalendarSync className="size-5" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">
                        {recurrence.description}
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500">
                        {recurrence.creditCardName ?? recurrence.accountName}
                        {recurrence.categoryName
                          ? ` • ${recurrence.categoryName}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {processing ? (
                    <LoaderCircle className="size-4 animate-spin text-zinc-500" />
                  ) : (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        title="Editar"
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
                        title={
                          recurrence.active
                            ? "Pausar"
                            : "Retomar"
                        }
                        onClick={() =>
                          void executeAction(
                            recurrence.id,
                            () =>
                              recurrence.active
                                ? financeService.recurrences.pause(
                                    recurrence.id,
                                  )
                                : financeService.recurrences.resume(
                                    recurrence.id,
                                  ),
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
                        onClick={() =>
                          removeRecurrence(recurrence)
                        }
                        className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-rose-400/10 hover:text-rose-300"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-zinc-600">
                      Valor
                    </p>

                    <p
                      className={[
                        "mt-1 text-lg font-semibold",
                        recurrence.type === "INCOME"
                          ? "text-emerald-300"
                          : "text-rose-300",
                      ].join(" ")}
                    >
                      {currencyFormatter.format(recurrence.amount)}
                    </p>
                  </div>

                  <span className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400">
                    {frequencyLabels[recurrence.frequency]}
                    {recurrence.interval > 1
                      ? ` • a cada ${recurrence.interval}`
                      : ""}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
                  <div>
                    <p className="text-xs text-zinc-600">
                      Próxima geração
                    </p>

                    <p className="mt-1 text-sm text-zinc-300">
                      {formatDate(
                        recurrence.nextGenerationDate,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-600">
                      Ocorrências restantes
                    </p>

                    <p className="mt-1 text-sm text-zinc-300">
                      {recurrence.remainingOccurrences ??
                        "Sem limite"}
                    </p>
                  </div>
                </div>

                {!recurrence.active ? (
                  <p className="mt-4 text-xs font-medium text-amber-300">
                    Recorrência pausada
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
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