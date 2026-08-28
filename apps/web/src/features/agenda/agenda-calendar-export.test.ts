import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { GET } from "@/app/api/agenda/calendar/route";

import {
  buildAgendaIcs,
  buildAgendaIcsEndpointUrl,
  safeAgendaIcsFileName,
} from "./agenda-calendar-export";

const now = new Date("2026-08-27T12:00:00.000Z");

describe("agenda calendar export", () => {
  it("creates an escaped iCalendar event with timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const ics = buildAgendaIcs({
      timeZone: "America/Sao_Paulo",
      assignedToName: "Gabriela Bertao",
      response: {
        eventId: "evt-123",
        recurrenceFrequency: "NONE",
        occurrencesCreated: 1,
        firstOccurrenceStartsAt: "2026-09-02T13:30:00.000Z",
        lastOccurrenceStartsAt: "2026-09-02T13:30:00.000Z",
      },
      request: {
        title: "Natação Bernardo",
        description: "Levar roupa; toalha, e exame\nTudo pronto.",
        category: "APPOINTMENT",
        location: "Rua Pindorama, 456",
        allDay: false,
        startsAt: "2026-09-02T13:30:00.000Z",
        endsAt: "2026-09-02T14:20:00.000Z",
        remindersInMinutes: [30],
      },
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain(
      "UID:evt-123-2026-09-02t133000000z@nucleo.central-familiar",
    );
    expect(ics).toContain("DTSTAMP:20260827T120000Z");
    expect(ics).toContain(
      "DTSTART;TZID=America/Sao_Paulo:20260902T103000",
    );
    expect(ics).toContain(
      "DTEND;TZID=America/Sao_Paulo:20260902T112000",
    );
    expect(ics).toContain(
      "DESCRIPTION:Levar roupa\\; toalha\\, e exame\\nTudo pronto.",
    );
    expect(ics).toContain("LOCATION:Rua Pindorama\\, 456");
    expect(ics).toContain("METHOD:PUBLISH");

    vi.useRealTimers();
  });

  it("exports all-day events as exclusive date ranges", () => {
    const ics = buildAgendaIcs({
      timeZone: "America/Sao_Paulo",
      response: {
        eventId: "evt-day",
        recurrenceFrequency: "NONE",
        occurrencesCreated: 1,
        firstOccurrenceStartsAt: "2026-09-02T03:00:00.000Z",
        lastOccurrenceStartsAt: "2026-09-02T03:00:00.000Z",
      },
      request: {
        title: "Aniversario",
        category: "BIRTHDAY",
        allDay: true,
        startsAt: "2026-09-02T03:00:00.000Z",
        endsAt: "2026-09-03T02:59:00.000Z",
      },
    });

    expect(ics).toContain("DTSTART;VALUE=DATE:20260902");
    expect(ics).toContain("DTEND;VALUE=DATE:20260903");
  });

  it("includes an escaped URL when provided", () => {
    const ics = buildAgendaIcs({
      timeZone: "America/Sao_Paulo",
      url: "https://nucleo.example/agenda?view=day,home",
      response: {
        eventId: "evt-url",
        recurrenceFrequency: "NONE",
        occurrencesCreated: 1,
        firstOccurrenceStartsAt: "2026-09-02T13:30:00.000Z",
        lastOccurrenceStartsAt: "2026-09-02T13:30:00.000Z",
      },
      request: {
        title: "Consulta",
        category: "HEALTH",
        allDay: false,
        startsAt: "2026-09-02T13:30:00.000Z",
        endsAt: "2026-09-02T14:00:00.000Z",
      },
    });

    expect(ics).toContain(
      "URL:https://nucleo.example/agenda?view=day\\,home",
    );
  });

  it("creates a safe calendar file name", () => {
    expect(
      safeAgendaIcsFileName("Natação: Bernardo / exame"),
    ).toBe("natacao-bernardo-exame");
    expect(safeAgendaIcsFileName("...")).toBe(
      "compromisso",
    );
  });

  it("serves ICS through the calendar endpoint with calendar headers", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const event = {
      timeZone: "America/Sao_Paulo",
      response: {
        eventId: "evt-route",
        recurrenceFrequency: "NONE" as const,
        occurrencesCreated: 1,
        firstOccurrenceStartsAt: "2026-09-02T13:30:00.000Z",
        lastOccurrenceStartsAt: "2026-09-02T13:30:00.000Z",
      },
      request: {
        title: "Reunião Núcleo",
        description: "Pauta, custos; agenda",
        category: "FAMILY" as const,
        location: "Casa",
        allDay: false,
        startsAt: "2026-09-02T13:30:00.000Z",
        endsAt: "2026-09-02T14:30:00.000Z",
      },
    };
    const endpointUrl = buildAgendaIcsEndpointUrl(event);
    const response = GET(
      new Request(`https://app.example${endpointUrl}`),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/calendar; charset=utf-8",
    );
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="reuniao-nucleo.ics"',
    );
    await expect(response.text()).resolves.toContain(
      "SUMMARY:Reunião Núcleo",
    );

    vi.useRealTimers();
  });
});
