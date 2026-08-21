"use client";

import { ModalShell } from "@/components/ui/modal-shell";
import { AgendaActionMenu } from "@/features/agenda/agenda-action-menu";

import type { AgendaOccurrenceDetails } from "@/types/agenda";

import {
  Bell,
  CalendarDays,
  Clock3,
  MapPin,
  Repeat2,
  UserRound,
} from "lucide-react";

interface AgendaOccurrenceDetailsProps {
  occurrence: AgendaOccurrenceDetails | null;
  loading: boolean;
  performingAction: boolean;
  onClose: () => void;
  onComplete: (notes?: string) => Promise<void>;
  onCancel: (notes?: string) => Promise<void>;
  onDuplicate: () => Promise<void>;
  onDeleteOccurrence: () => Promise<void>;
  onDeleteSeries: () => Promise<void>;
}

const dateFormatter =
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  });

const timeFormatter =
  new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

const categoryLabels: Record<string, string> = {
  APPOINTMENT: "Compromisso",
  HEALTH: "Saúde",
  SCHOOL: "Escola",
  FAMILY: "Família",
  PERSONAL: "Pessoal",
  BIRTHDAY: "Aniversário",
  TASK: "Tarefa",
  OTHER: "Outro",
};

const recurrenceLabels: Record<string, string> = {
  NONE: "Não se repete",
  DAILY: "Diária",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
};

function reminderLabel(minutes: number): string {
  if (minutes === 0) {
    return "No horário";
  }

  if (minutes < 60) {
    return `${minutes} minutos antes`;
  }

  if (minutes === 60) {
    return "1 hora antes";
  }

  if (minutes === 1440) {
    return "1 dia antes";
  }

  if (minutes % 1440 === 0) {
    return `${minutes / 1440} dias antes`;
  }

  if (minutes % 60 === 0) {
    return `${minutes / 60} horas antes`;
  }

  return `${minutes} minutos antes`;
}

export function AgendaOccurrenceDetailsPanel({
  occurrence,
  loading,
  performingAction,
  onClose,
  onComplete,
  onCancel,
  onDuplicate,
  onDeleteOccurrence,
  onDeleteSeries,
}: AgendaOccurrenceDetailsProps) {
  if (!loading && !occurrence) {
    return null;
  }

  const category = occurrence
    ? (
        categoryLabels[occurrence.category]
        ?? occurrence.category
      )
    : "Agenda";

  const title =
    occurrence?.title
    ?? "Detalhes do compromisso";

  return (
    <ModalShell
      eyebrow={category}
      title={title}
      titleId="agenda-occurrence-details-title"
      busy={performingAction}
      onClose={onClose}
    >
      <div
        className={[
          "min-h-0 flex-1",
          "overflow-y-auto",
          "overscroll-contain",
          "[scrollbar-color:rgba(255,255,255,0.16)_transparent]",
        ].join(" ")}
      >
        {loading || !occurrence ? (
          <AgendaOccurrenceLoading />
        ) : (
          <div className="animate-fade-up px-5 py-6 sm:px-7">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={occurrence.status}
              />

              {occurrence.allDay && (
                <span className="inline-flex min-h-7 items-center rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 text-[0.7rem] font-medium text-zinc-400">
                  Dia inteiro
                </span>
              )}

              {occurrence.recurrence
                && occurrence.recurrence.frequency
                  !== "NONE" && (
                  <span className="inline-flex min-h-7 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 text-[0.7rem] font-medium text-zinc-400">
                    <Repeat2 className="size-3.5" />

                    {
                      recurrenceLabels[
                        occurrence.recurrence
                          .frequency
                      ]
                      ?? occurrence.recurrence
                        .frequency
                    }
                  </span>
                )}
            </div>

            {occurrence.description && (
              <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3.5">
                <p className="whitespace-pre-line text-sm leading-6 text-zinc-400">
                  {occurrence.description}
                </p>
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailCard
                icon={CalendarDays}
                label="Data"
                value={dateFormatter.format(
                  new Date(occurrence.startsAt),
                )}
              />

              <DetailCard
                icon={Clock3}
                label="Horário"
                value={
                  occurrence.allDay
                    ? "Dia inteiro"
                    : formatOccurrenceTime(
                        occurrence.startsAt,
                        occurrence.endsAt,
                      )
                }
              />

              {occurrence.location && (
                <DetailCard
                  icon={MapPin}
                  label="Local"
                  value={occurrence.location}
                />
              )}

              {occurrence.assignedTo && (
                <DetailCard
                  icon={UserRound}
                  label="Responsável"
                  value={
                    occurrence.assignedTo.name
                  }
                />
              )}

              <DetailCard
                icon={Repeat2}
                label="Recorrência"
                value={
                  occurrence.recurrence
                    ? (
                        recurrenceLabels[
                          occurrence.recurrence
                            .frequency
                        ]
                        ?? occurrence.recurrence
                          .frequency
                      )
                    : "Não se repete"
                }
              />

              {occurrence.remindersInMinutes
                .length > 0 && (
                <DetailCard
                  icon={Bell}
                  label="Lembretes"
                  value={
                    occurrence
                      .remindersInMinutes
                      .map(reminderLabel)
                      .join(", ")
                  }
                />
              )}
            </div>

            {occurrence.notes && (
              <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-zinc-600">
                  Observações
                </p>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-400">
                  {occurrence.notes}
                </p>
              </div>
            )}

            <div className="mt-5 flex items-center gap-2 text-xs text-zinc-600">
              <UserRound className="size-3.5" />

              <span>
                Criado por{" "}
                <strong className="font-medium text-zinc-400">
                  {occurrence.createdBy.name}
                </strong>
              </span>
            </div>

            <div className="mt-6">
              <AgendaActionMenu
                occurrence={occurrence}
                loading={performingAction}
                onComplete={onComplete}
                onCancel={onCancel}
                onDuplicate={onDuplicate}
                onDeleteOccurrence={
                  onDeleteOccurrence
                }
                onDeleteSeries={
                  onDeleteSeries
                }
              />
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function AgendaOccurrenceLoading() {
  return (
    <div className="animate-pulse px-5 py-6 sm:px-7">
      <div className="flex gap-2">
        <div className="h-7 w-24 rounded-lg bg-white/[0.06]" />
        <div className="h-7 w-20 rounded-lg bg-white/[0.04]" />
      </div>

      <div className="mt-5 h-20 rounded-2xl bg-white/[0.04]" />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <div
              key={index}
              className="h-24 rounded-2xl bg-white/[0.04]"
            />
          ),
        )}
      </div>
    </div>
  );
}

interface DetailCardProps {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}

function DetailCard({
  icon: Icon,
  label,
  value,
}: DetailCardProps) {
  return (
    <div className="flex min-w-0 gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035]">
        <Icon className="size-4 text-zinc-500" />
      </div>

      <div className="min-w-0">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-zinc-600">
          {label}
        </p>

        <p className="mt-1 break-words text-sm leading-5 text-zinc-300">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: AgendaOccurrenceDetails["status"];
}) {
  const label =
    status === "COMPLETED"
      ? "Concluído"
      : status === "CANCELLED"
        ? "Cancelado"
        : "Agendado";

  const styles =
    status === "COMPLETED"
      ? [
          "border-emerald-400/20",
          "bg-emerald-400/[0.07]",
          "text-emerald-200",
        ]
      : status === "CANCELLED"
        ? [
            "border-red-400/20",
            "bg-red-400/[0.07]",
            "text-red-200",
          ]
        : [
            "border-white/[0.08]",
            "bg-white/[0.04]",
            "text-zinc-300",
          ];

  return (
    <span
      className={[
        "inline-flex min-h-7",
        "items-center rounded-lg border",
        "px-2.5 text-[0.7rem]",
        "font-medium",
        ...styles,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function formatOccurrenceTime(
  startsAt: string,
  endsAt: string | null,
): string {
  const start = timeFormatter.format(
    new Date(startsAt),
  );

  if (!endsAt) {
    return start;
  }

  const end = timeFormatter.format(
    new Date(endsAt),
  );

  return `${start} até ${end}`;
}