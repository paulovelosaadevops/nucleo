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

const whatsappEmoji = {
  calendar: "📅",
  note: "📝",
  date: "🗓️",
  time: "🕐",
  location: "📍",
  responsible: "👤",
  recurrence: "🔁",
  status: "📌",
  observations: "💬",
  completed: "✅",
  cancelled: "❌",
} as const;

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

function addLine(
  lines: string[],
  emoji: string,
  label: string,
  value?: string | null,
) {
  const normalized = value?.trim();

  if (!normalized) {
    return;
  }

  lines.push(`${emoji} *${label}:* ${normalized}`);
}

function ensureTerminalPunctuation(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return trimmed;
  }

  return /[.!?…]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function buildAgendaWhatsAppMessage(
  occurrence: AgendaOccurrenceDetails,
  timeZone?: string,
): string {
  const lines = [
    `${whatsappEmoji.calendar} *COMPROMISSO — NÚCLEO*`,
    "",
  ];

  const title = occurrence.title.trim();

  if (title) {
    lines.push(`${whatsappEmoji.note} *${title}*`, "");
  }

  addLine(lines, whatsappEmoji.date, "Data", formatAgendaDate(occurrence.startsAt, timeZone));
  addLine(lines, whatsappEmoji.time, "Horário", occurrenceTimeLabel(occurrence, timeZone));
  addLine(lines, whatsappEmoji.location, "Local", occurrence.location);
  addLine(lines, whatsappEmoji.responsible, "Responsável", occurrence.assignedTo?.name);
  addLine(lines, whatsappEmoji.recurrence, "Recorrência", recurrenceLabel(occurrence.recurrence));
  addLine(lines, whatsappEmoji.status, "Status", statusLabels[occurrence.status]);

  if (occurrence.completedAt) {
    addLine(
      lines,
      whatsappEmoji.completed,
      "Concluído em",
      formatAgendaDateTime(occurrence.completedAt, timeZone),
    );
  }

  if (occurrence.cancelledAt) {
    addLine(
      lines,
      whatsappEmoji.cancelled,
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
    lines.push(
      "",
      `${whatsappEmoji.observations} *Observações:*`,
      ensureTerminalPunctuation(observation),
    );
  }

  lines.push("", "_Enviado pelo Núcleo | Central Familiar_");

  return lines.join("\n");
}

export function buildAgendaWhatsAppUrl(
  occurrence: AgendaOccurrenceDetails,
  timeZone?: string,
): string {
  const message = buildAgendaWhatsAppMessage(occurrence, timeZone);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return whatsappUrl;
}

export function buildAgendaWhatsAppWebUrl(
  occurrence: AgendaOccurrenceDetails,
  timeZone?: string,
): string {
  const message = buildAgendaWhatsAppMessage(occurrence, timeZone);
  const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;

  return whatsappUrl;
}

function shouldUseMobileWhatsApp(userAgent: string): boolean {
  return /Android|iPhone|iPad|iPod/i.test(userAgent);
}

export function buildAgendaWhatsAppShareUrl(
  occurrence: AgendaOccurrenceDetails,
  timeZone: string | undefined,
  userAgent: string,
): string {
  return shouldUseMobileWhatsApp(userAgent)
    ? buildAgendaWhatsAppUrl(occurrence, timeZone)
    : buildAgendaWhatsAppWebUrl(occurrence, timeZone);
}

export function openAgendaWhatsAppShare(
  occurrence: AgendaOccurrenceDetails,
  timeZone?: string,
) {
  window.open(
    buildAgendaWhatsAppShareUrl(
      occurrence,
      timeZone,
      window.navigator.userAgent,
    ),
    "_blank",
    "noopener,noreferrer",
  );
}
