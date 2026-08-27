import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { buildAgendaIcs } from "./agenda-calendar-export";

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
        title: "Natacao Bernardo",
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
    expect(ics).toContain("UID:evt-123@nucleo.central-familiar");
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
});
