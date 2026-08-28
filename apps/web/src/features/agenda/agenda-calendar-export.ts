import type {
  CreateAgendaEventRequest,
  CreateAgendaEventResponse,
} from "@/types/agenda";

export interface CalendarExportEvent {
  request: CreateAgendaEventRequest;
  response: CreateAgendaEventResponse;
  timeZone: string;
  assignedToName?: string;
  url?: string;
}

function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string) {
  const result: string[] = [];
  let remaining = line;

  while (remaining.length > 74) {
    result.push(remaining.slice(0, 74));
    remaining = ` ${remaining.slice(74)}`;
  }

  result.push(remaining);

  return result.join("\r\n");
}

function formatUtcDate(value: Date) {
  return value
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function getZonedParts(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;
}

function formatZonedDateTime(
  value: string,
  timeZone: string,
) {
  const parts = getZonedParts(value, timeZone);

  return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}`;
}

function formatZonedDate(value: string, timeZone: string) {
  const parts = getZonedParts(value, timeZone);

  return `${parts.year}${parts.month}${parts.day}`;
}

function addDays(date: string, days: number) {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6));
  const day = Number(date.slice(6, 8));
  const next = new Date(Date.UTC(year, month - 1, day + days));

  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0"),
  ].join("");
}

function buildStableUid(event: CalendarExportEvent) {
  return [
    event.response.eventId,
    event.response.firstOccurrenceStartsAt,
  ]
    .filter(Boolean)
    .join("-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();
}

export function buildAgendaIcs(event: CalendarExportEvent) {
  const {
    request,
    timeZone,
    assignedToName,
    url,
  } = event;
  const uid = `${buildStableUid(event)}@nucleo.central-familiar`;
  const descriptionParts = [
    request.description,
    assignedToName
      ? `Responsavel: ${assignedToName}`
      : undefined,
    "Criado pelo Nucleo | Central Familiar",
  ].filter(Boolean);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nucleo//Central Familiar//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeText(uid)}`,
    `DTSTAMP:${formatUtcDate(new Date())}`,
    `SUMMARY:${escapeText(request.title)}`,
  ];

  if (request.allDay) {
    const startDate = formatZonedDate(request.startsAt, timeZone);
    const endDate = request.endsAt
      ? formatZonedDate(request.endsAt, timeZone)
      : startDate;

    lines.push(`DTSTART;VALUE=DATE:${startDate}`);
    lines.push(`DTEND;VALUE=DATE:${addDays(endDate, 1)}`);
  } else {
    lines.push(
      `DTSTART;TZID=${escapeText(timeZone)}:${formatZonedDateTime(request.startsAt, timeZone)}`,
    );
    lines.push(
      `DTEND;TZID=${escapeText(timeZone)}:${formatZonedDateTime(request.endsAt ?? request.startsAt, timeZone)}`,
    );
  }

  if (request.location) {
    lines.push(`LOCATION:${escapeText(request.location)}`);
  }

  if (descriptionParts.length > 0) {
    lines.push(
      `DESCRIPTION:${escapeText(descriptionParts.join("\n\n"))}`,
    );
  }

  if (url) {
    lines.push(`URL:${escapeText(url)}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

export function safeAgendaIcsFileName(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "compromisso"
  );
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function buildAgendaIcsEndpointUrl(
  event: CalendarExportEvent,
) {
  const payload = encodeBase64Url(JSON.stringify(event));
  const fileName = `${safeAgendaIcsFileName(event.request.title)}.ics`;
  const params = new URLSearchParams({
    data: payload,
    filename: fileName,
  });

  return `/api/agenda/calendar?${params.toString()}`;
}

export function openAgendaIcs(event: CalendarExportEvent) {
  window.location.assign(buildAgendaIcsEndpointUrl(event));
}

export function downloadAgendaIcs(event: CalendarExportEvent) {
  const ics = buildAgendaIcs(event);
  const fileName = `${safeAgendaIcsFileName(event.request.title)}.ics`;
  const blob = new Blob([ics], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener noreferrer";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareAgendaIcsFile(
  event: CalendarExportEvent,
) {
  const ics = buildAgendaIcs(event);
  const fileName = `${safeAgendaIcsFileName(event.request.title)}.ics`;
  const blob = new Blob([ics], {
    type: "text/calendar;charset=utf-8",
  });
  const file = new File([blob], fileName, {
    type: "text/calendar",
  });
  const navigatorWithShare = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  if (
    navigatorWithShare.canShare?.({
      files: [file],
    }) &&
    navigator.share
  ) {
    await navigator.share({
      title: event.request.title,
      text: "Arquivo de calendario do compromisso.",
      files: [file],
    });
    return;
  }

  downloadAgendaIcs(event);
}
