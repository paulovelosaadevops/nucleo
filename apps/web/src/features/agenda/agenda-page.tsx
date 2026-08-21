"use client";

import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AgendaCalendarStrip } from "@/features/agenda/agenda-calendar-strip";
import { AgendaEventForm } from "@/features/agenda/agenda-event-form";
import { AgendaOccurrenceCard } from "@/features/agenda/agenda-occurrence-card";
import { AgendaOccurrenceDetailsPanel } from "@/features/agenda/agenda-occurrence-details";
import { useAgenda } from "@/features/agenda/use-agenda";
import { cn } from "@/lib/cn";
import type { OccurrenceStatus } from "@/types/agenda";
import {
  CalendarDays,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

const filters: Array<{
  label: string;
  value: OccurrenceStatus | undefined;
}> = [
  { label: "Todos", value: undefined },
  { label: "Agendados", value: "SCHEDULED" },
  { label: "Concluídos", value: "COMPLETED" },
  { label: "Cancelados", value: "CANCELLED" },
];

const fullDateFormatter =
  new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

function parseDate(value: string): Date {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

export function AgendaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formOpen, setFormOpen] =
    useState(false);

  const {
    selectedDate,
    setSelectedDate,
    statusFilter,
    setStatusFilter,
    occurrences,
    selectedOccurrence,
    loading,
    loadingDetails,
    performingAction,
    error,
    refresh,
    openOccurrence,
    closeOccurrence,
    createEvent,
    completeOccurrence,
    cancelOccurrence,
    duplicateOccurrence,
    removeOccurrence,
    removeEventSeries,
  } = useAgenda();

  useEffect(() => {
    if (searchParams.get("novo") === "true") {
      setFormOpen(true);
    }

    const occurrenceId =
      searchParams.get("ocorrencia");

    if (occurrenceId) {
      void openOccurrence(occurrenceId);
    }
  }, [
    openOccurrence,
    searchParams,
  ]);

  function clearQuery() {
    router.replace("/agenda", {
      scroll: false,
    });
  }

  function closeForm() {
    setFormOpen(false);
    clearQuery();
  }

  function closeDetails() {
    closeOccurrence();
    clearQuery();
  }

  const selectedDateLabel =
    fullDateFormatter
      .format(parseDate(selectedDate))
      .replace(
        /^./,
        (character) =>
          character.toUpperCase(),
      );

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow="Rotina familiar"
        title="Agenda"
        description="Compromissos, tarefas e lembretes compartilhados."
        action={
          <Button
            onClick={() =>
              setFormOpen(true)
            }
          >
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        }
      />

      <AgendaCalendarStrip
        selectedDate={selectedDate}
        onChange={setSelectedDate}
      />

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-200">
              {selectedDateLabel}
            </h2>

            <p className="mt-1 text-xs text-zinc-600">
              {occurrences.length}{" "}
              {occurrences.length === 1
                ? "compromisso"
                : "compromissos"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Atualizar agenda"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                loading && "animate-spin",
              )}
            />
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => {
            const active =
              statusFilter === filter.value;

            return (
              <button
                key={filter.label}
                type="button"
                onClick={() =>
                  setStatusFilter(filter.value)
                }
                className={cn(
                  "h-9 shrink-0 rounded-xl border px-3.5 text-xs font-medium transition",
                  active
                    ? "border-white bg-white text-black"
                    : "border-white/[0.08] bg-white/[0.025] text-zinc-500 hover:text-white",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-400/15 bg-red-400/[0.055] px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-[1.25rem] border border-white/[0.06] bg-white/[0.03]"
                />
              ),
            )}
          </div>
        ) : occurrences.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={CalendarDays}
              title="Nenhum compromisso"
              description="Este dia está livre. Aproveite ou adicione um novo compromisso."
              actionLabel="Adicionar compromisso"
              actionIcon={
                <Plus className="h-4 w-4" />
              }
              onAction={() =>
                setFormOpen(true)
              }
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {occurrences.map(
              (occurrence) => (
                <AgendaOccurrenceCard
                  key={
                    occurrence.occurrenceId
                  }
                  occurrence={occurrence}
                  onClick={() => {
                    router.replace(
                      `/agenda?ocorrencia=${occurrence.occurrenceId}`,
                      {
                        scroll: false,
                      },
                    );

                    void openOccurrence(
                      occurrence.occurrenceId,
                    );
                  }}
                />
              ),
            )}
          </div>
        )}
      </section>

      <AgendaEventForm
        open={formOpen}
        initialDate={selectedDate}
        loading={performingAction}
        onClose={closeForm}
        onCreate={createEvent}
      />

      <AgendaOccurrenceDetailsPanel
        occurrence={selectedOccurrence}
        loading={loadingDetails}
        performingAction={performingAction}
        onClose={closeDetails}
        onComplete={async (notes) => {
          if (!selectedOccurrence) {
            return;
          }

          await completeOccurrence(
            selectedOccurrence.occurrenceId,
            { notes },
          );
        }}
        onCancel={async (notes) => {
          if (!selectedOccurrence) {
            return;
          }

          await cancelOccurrence(
            selectedOccurrence.occurrenceId,
            { notes },
          );
        }}
        onDuplicate={async () => {
          if (!selectedOccurrence) {
            return;
          }

          await duplicateOccurrence(
            selectedOccurrence.occurrenceId,
          );
        }}
        onDeleteOccurrence={async () => {
          if (!selectedOccurrence) {
            return;
          }

          await removeOccurrence(
            selectedOccurrence.occurrenceId,
          );
        }}
        onDeleteSeries={async () => {
          if (!selectedOccurrence) {
            return;
          }

          await removeEventSeries(
            selectedOccurrence.eventId,
          );
        }}
      />
    </div>
  );
}