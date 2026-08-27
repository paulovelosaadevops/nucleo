"use client";

import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import { AgendaActionMenu } from "@/features/agenda/agenda-action-menu";
import {
  formatAgendaDate,
  formatAgendaDateTime,
  occurrenceTimeLabel,
  openAgendaWhatsAppShare,
  recurrenceLabel,
} from "@/features/agenda/agenda-whatsapp";
import { WhatsAppIcon } from "@/features/agenda/whatsapp-icon";
import { useAuth } from "@/hooks/use-auth";
import type { AgendaOccurrenceDetails } from "@/types/agenda";
import {
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
  const { session } = useAuth();
  const timeZone = session?.family.timeZone ?? "America/Sao_Paulo";

  if (!loading && !occurrence) {
    return null;
  }

  const category = occurrence
    ? categoryLabels[occurrence.category] ?? occurrence.category
    : "Agenda";

  const title = occurrence?.title ?? "Detalhes do compromisso";

  return (
    <ModalShell
      eyebrow={category}
      title={title}
      titleId="agenda-occurrence-details-title"
      busy={performingAction}
      onClose={onClose}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-color:rgba(255,255,255,0.16)_transparent]">
        {loading || !occurrence ? (
          <AgendaOccurrenceLoading />
        ) : (
          <div className="animate-fade-up px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={occurrence.status} />

                  {occurrence.allDay && (
                    <span className="inline-flex min-h-7 items-center rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 text-[0.7rem] font-medium text-zinc-400">
                      Dia inteiro
                    </span>
                  )}
                </div>

                <h3 className="mt-3 break-words text-xl font-semibold leading-tight text-white">
                  {occurrence.title}
                </h3>
              </div>

              <Button
                variant="secondary"
                className="shrink-0"
                aria-label="Enviar compromisso pelo WhatsApp"
                onClick={() => openAgendaWhatsAppShare(occurrence, timeZone)}
              >
                <WhatsAppIcon className="h-4 w-4" />
                Enviar pelo WhatsApp
              </Button>
            </div>

            <div className="mt-5 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.07] bg-white/[0.025]">
              <DetailRow
                icon={CalendarDays}
                label="Data"
                value={formatAgendaDate(occurrence.startsAt, timeZone)}
              />

              <DetailRow
                icon={Clock3}
                label="Horário"
                value={occurrenceTimeLabel(occurrence, timeZone)}
              />

              {occurrence.assignedTo && (
                <DetailRow
                  icon={UserRound}
                  label="Responsável"
                  value={occurrence.assignedTo.name}
                />
              )}

              {occurrence.location && (
                <DetailRow
                  icon={MapPin}
                  label="Local"
                  value={occurrence.location}
                />
              )}

              <DetailRow
                icon={Repeat2}
                label="Recorrência"
                value={recurrenceLabel(occurrence.recurrence)}
              />

              {occurrence.completedAt && (
                <DetailRow
                  icon={CalendarDays}
                  label="Conclusão"
                  value={formatAgendaDateTime(
                    occurrence.completedAt,
                    timeZone,
                  )}
                />
              )}

              {occurrence.cancelledAt && (
                <DetailRow
                  icon={CalendarDays}
                  label="Cancelamento"
                  value={formatAgendaDateTime(
                    occurrence.cancelledAt,
                    timeZone,
                  )}
                />
              )}
            </div>

            {occurrence.description && (
              <TextBlock label="Descrição" value={occurrence.description} />
            )}

            {occurrence.notes && (
              <TextBlock label="Observações" value={occurrence.notes} />
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
                onDeleteOccurrence={onDeleteOccurrence}
                onDeleteSeries={onDeleteSeries}
                onShareWhatsApp={() =>
                  openAgendaWhatsAppShare(occurrence, timeZone)
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

      <div className="mt-5 h-12 rounded-2xl bg-white/[0.04]" />

      <div className="mt-5 rounded-2xl border border-white/[0.06]">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-14 border-b border-white/[0.04] last:border-b-0"
          />
        ))}
      </div>
    </div>
  );
}

interface DetailRowProps {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex min-w-0 items-start gap-3 px-4 py-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/25">
        <Icon className="size-4 text-zinc-500" />
      </div>

      <div className="min-w-0 flex-1 sm:grid sm:grid-cols-[8rem_1fr] sm:gap-4">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-zinc-600">
          {label}
        </p>

        <p className="mt-1 break-words text-sm leading-5 text-zinc-300 sm:mt-0">
          {value}
        </p>
      </div>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 border-t border-white/[0.07] pt-4">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-zinc-600">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-400">
        {value}
      </p>
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
      ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200"
      : status === "CANCELLED"
        ? "border-red-400/20 bg-red-400/[0.07] text-red-200"
        : "border-white/[0.08] bg-white/[0.04] text-zinc-300";

  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-lg border px-2.5 text-[0.7rem] font-medium",
        styles,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
