import type {
  AgendaOccurrenceDetails,
  RecurrenceFrequency,
} from "@/types/agenda";

const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

const statusLabels: Record<AgendaOccurrenceDetails["status"], string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Conclu\u00eddo",
  CANCELLED: "Cancelado",
};

const recurrenceLabels: Record<RecurrenceFrequency, string> = {
  NONE: "N\u00e3o se repete",
  DAILY: "Di\u00e1ria",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
};

const whatsappEmoji = {
  calendar: "\u{1F4C5}",
  note: "\u{1F4DD}",
  date: "\u{1F5D3}\u{FE0F}",
  time: "\u{1F550}",
  location: "\u{1F4CD}",
  responsible: "\u{1F464}",
  recurrence: "\u{1F501}",
  status: "\u{1F4CC}",
  observations: "\u{1F4AC}",
  completed: "\u{2705}",
  cancelled: "\u{274C}",
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

  return `${start} \u00e0s ${formatAgendaTime(occurrence.endsAt, timeZone)}`;
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

  return /[.!?\u2026]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function buildAgendaWhatsAppMessage(
  occurrence: AgendaOccurrenceDetails,
  timeZone?: string,
): string {
  const lines = [
    `${whatsappEmoji.calendar} *COMPROMISSO \u2014 N\u00daCLEO*`,
    "",
  ];

  const title = occurrence.title.trim();

  if (title) {
    lines.push(`${whatsappEmoji.note} *${title}*`, "");
  }

  addLine(lines, whatsappEmoji.date, "Data", formatAgendaDate(occurrence.startsAt, timeZone));
  addLine(lines, whatsappEmoji.time, "Hor\u00e1rio", occurrenceTimeLabel(occurrence, timeZone));
  addLine(lines, whatsappEmoji.location, "Local", occurrence.location);
  addLine(lines, whatsappEmoji.responsible, "Respons\u00e1vel", occurrence.assignedTo?.name);
  addLine(lines, whatsappEmoji.recurrence, "Recorr\u00eancia", recurrenceLabel(occurrence.recurrence));
  addLine(lines, whatsappEmoji.status, "Status", statusLabels[occurrence.status]);

  if (occurrence.completedAt) {
    addLine(
      lines,
      whatsappEmoji.completed,
      "Conclu\u00eddo em",
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
      `${whatsappEmoji.observations} *Observa\u00e7\u00f5es:*`,
      ensureTerminalPunctuation(observation),
    );
  }

  lines.push("", "_Enviado pelo N\u00facleo | Central Familiar_");

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
