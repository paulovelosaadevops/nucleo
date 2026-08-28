import {
  buildAgendaIcs,
  safeAgendaIcsFileName,
  type CalendarExportEvent,
} from "@/features/agenda/agenda-calendar-export";

export const dynamic = "force-dynamic";

function decodeBase64Url(value: string) {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) =>
    char.charCodeAt(0),
  );

  return new TextDecoder().decode(bytes);
}

function quoteHeaderValue(value: string) {
  return value.replace(/["\\\r\n]/g, "");
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const data = url.searchParams.get("data");

  if (!data) {
    return new Response("Missing calendar payload.", {
      status: 400,
    });
  }

  try {
    const event = JSON.parse(
      decodeBase64Url(data),
    ) as CalendarExportEvent;
    const fileName = `${safeAgendaIcsFileName(event.request.title)}.ics`;
    const ics = buildAgendaIcs(event);

    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${quoteHeaderValue(fileName)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Invalid calendar payload.", {
      status: 400,
    });
  }
}
