import type {
  AgendaOccurrenceDetails,
  RecurrenceFrequency,
} from "@/types/agenda";

const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

const statusLabels: Record<AgendaOccurrenceDetails["status"], string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

const recurrenceLabels: Record<RecurrenceFrequency, string> = {
  NONE: "Não se repete",
  DAILY: "Diária",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
};

function formatter(
  options: Intl.DateTimeFormatOptions,
  timeZone?: string,
) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timeZone || DEFAULT_TIME_ZONE,
    ...options,
  });
}

export function formatAgendaDate(
  value: string,
  timeZone?: string,
): string {
  return formatter(
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
    timeZone,
  ).format(new Date(value));
}

export function formatAgendaTime(
  value: string,
  timeZone?: string,
): string {
  return formatter(
    {
      hour: "2-digit",
      minute: "2-digit",
    },
    timeZone,
  ).format(new Date(value));
}

export function formatAgendaDateTime(
  value: string,
  timeZone?: string,
): string {
  return formatter(
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    timeZone,
  ).format(new Date(value));
}

export function recurrenceLabel(
  recurrence: AgendaOccurrenceDetails["recurrence"],
): string {
  if (!recurrence) {
    return recurrenceLabels.NONE;
  }

  const label =
    recurrenceLabels[recurrence.frequency] ?? recurrence.frequency;

  if (
    recurrence.frequency === "NONE" ||
    recurrence.interval <= 1
  ) {
    return label;
  }

  return `${label} a cada ${recurrence.interval}`;
}

export function occurrenceTimeLabel(
  occurrence: Pick<
    AgendaOccurrenceDetails,
    "allDay" | "startsAt" | "endsAt"
  >,
  timeZone?: string,
): string {
  if (occurrence.allDay) {
    return "Dia inteiro";
  }

  const start = formatAgendaTime(occurrence.startsAt, timeZone);

  if (!occurrence.endsAt) {
    return start;
  }

  return `${start} às ${formatAgendaTime(occurrence.endsAt, timeZone)}`;
}

function addLine(lines: string[], label: string, value?: string | null) {
  const normalized = value?.trim();

  if (!normalized) {
    return;
  }

  lines.push(`*${label}:* ${normalized}`);
}

export function buildAgendaWhatsAppMessage(
  occurrence: AgendaOccurrenceDetails,
  timeZone?: string,
): string {
  const lines = ["📅 *Compromisso — Núcleo*", ""];

  addLine(lines, "Título", occurrence.title);
  addLine(lines, "Status", statusLabels[occurrence.status]);
  addLine(lines, "Data", formatAgendaDate(occurrence.startsAt, timeZone));
  addLine(lines, "Horário", occurrenceTimeLabel(occurrence, timeZone));
  addLine(lines, "Local", occurrence.location);
  addLine(lines, "Responsável", occurrence.assignedTo?.name);
  addLine(lines, "Recorrência", recurrenceLabel(occurrence.recurrence));

  if (occurrence.completedAt) {
    addLine(
      lines,
      "Concluído em",
      formatAgendaDateTime(occurrence.completedAt, timeZone),
    );
  }

  if (occurrence.cancelledAt) {
    addLine(
      lines,
      "Cancelado em",
      formatAgendaDateTime(occurrence.cancelledAt, timeZone),
    );
  }

  const description = occurrence.description?.trim();
  const notes = occurrence.notes?.trim();
  const observation = [description, notes]
    .filter(Boolean)
    .join("\n\n");

  if (observation) {
    lines.push("", "*Observações:*", observation);
  }

  return lines.join("\n");
}

export function buildAgendaWhatsAppUrl(
  occurrence: AgendaOccurrenceDetails,
  timeZone?: string,
): string {
  return `https://wa.me/?text=${encodeURIComponent(
    buildAgendaWhatsAppMessage(occurrence, timeZone),
  )}`;
}

export function openAgendaWhatsAppShare(
  occurrence: AgendaOccurrenceDetails,
  timeZone?: string,
) {
  window.open(
    buildAgendaWhatsAppUrl(occurrence, timeZone),
    "_blank",
    "noopener,noreferrer",
  );
}
