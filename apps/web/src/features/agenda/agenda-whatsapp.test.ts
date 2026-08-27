import { describe, expect, it } from "vitest";
import type { AgendaOccurrenceDetails } from "@/types/agenda";
import {
  buildAgendaWhatsAppMessage,
  buildAgendaWhatsAppUrl,
  formatAgendaDate,
  occurrenceTimeLabel,
  recurrenceLabel,
} from "./agenda-whatsapp";

const baseOccurrence: AgendaOccurrenceDetails = {
  occurrenceId: "occurrence-1",
  eventId: "event-1",
  title: "Consulta do Bernardo",
  description: "Levar carteira de vacinação e exames.",
  category: "HEALTH",
  location: "Clínica Infantil",
  allDay: false,
  startsAt: "2026-08-28T17:30:00Z",
  endsAt: "2026-08-28T18:30:00Z",
  status: "SCHEDULED",
  assignedTo: {
    membershipId: "membership-1",
    userId: "user-1",
    name: "Paulo",
  },
  createdBy: {
    userId: "user-1",
    name: "Paulo",
  },
  recurrence: {
    frequency: "NONE",
    interval: 1,
    daysOfWeek: null,
    until: null,
    count: null,
  },
  remindersInMinutes: [],
  completedAt: null,
  cancelledAt: null,
  notes: null,
};

describe("agenda WhatsApp sharing", () => {
  it("builds a complete commitment message", () => {
    const message = buildAgendaWhatsAppMessage(
      baseOccurrence,
      "America/Sao_Paulo",
    );

    expect(message).toContain("📅 *Compromisso — Núcleo*");
    expect(message).toContain("*Título:* Consulta do Bernardo");
    expect(message).toContain("*Data:* 28/08/2026");
    expect(message).toContain("*Horário:* 14:30 às 15:30");
    expect(message).toContain("*Local:* Clínica Infantil");
    expect(message).toContain("*Responsável:* Paulo");
    expect(message).toContain("*Recorrência:* Não se repete");
    expect(message).toContain("*Observações:*\nLevar carteira");
  });

  it("omits empty optional fields", () => {
    const message = buildAgendaWhatsAppMessage({
      ...baseOccurrence,
      description: null,
      location: null,
      assignedTo: null,
      notes: null,
    });

    expect(message).not.toContain("*Local:*");
    expect(message).not.toContain("*Responsável:*");
    expect(message).not.toContain("*Observações:*");
  });

  it("shows all day instead of time range", () => {
    const occurrence = {
      ...baseOccurrence,
      allDay: true,
      endsAt: null,
    };

    expect(occurrenceTimeLabel(occurrence)).toBe("Dia inteiro");
    expect(buildAgendaWhatsAppMessage(occurrence)).toContain(
      "*Horário:* Dia inteiro",
    );
  });

  it("preserves accents and line breaks in the encoded URL", () => {
    const occurrence = {
      ...baseOccurrence,
      title: "Reunião: Núcleo & família",
      description: "Linha 1\nLinha 2 com ação",
    };

    const url = buildAgendaWhatsAppUrl(occurrence, "America/Sao_Paulo");
    const decoded = decodeURIComponent(url.replace("https://wa.me/?text=", ""));

    expect(url).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(url).toContain("%C3%A3");
    expect(decoded).toContain("Reunião: Núcleo & família");
    expect(decoded).toContain("Linha 1\nLinha 2 com ação");
  });

  it("formats recurrence details", () => {
    expect(
      recurrenceLabel({
        frequency: "WEEKLY",
        interval: 2,
        daysOfWeek: "MONDAY",
        until: null,
        count: null,
      }),
    ).toBe("Semanal a cada 2");
  });

  it("formats dates and times in the family timezone", () => {
    expect(formatAgendaDate("2026-08-28T02:30:00Z", "America/Sao_Paulo"))
      .toBe("27/08/2026");

    expect(
      occurrenceTimeLabel(
        {
          allDay: false,
          startsAt: "2026-08-28T02:30:00Z",
          endsAt: "2026-08-28T03:30:00Z",
        },
        "America/Sao_Paulo",
      ),
    ).toBe("23:30 às 00:30");
  });

  it("includes completion and cancellation dates when present", () => {
    const message = buildAgendaWhatsAppMessage(
      {
        ...baseOccurrence,
        status: "CANCELLED",
        cancelledAt: "2026-08-28T19:00:00Z",
      },
      "America/Sao_Paulo",
    );

    expect(message).toContain("*Status:* Cancelado");
    expect(message).toContain("*Cancelado em:* 28/08/2026, 16:00");
  });
});
