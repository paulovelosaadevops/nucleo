import { describe, expect, it } from "vitest";
import type { AgendaOccurrenceDetails } from "@/types/agenda";
import {
  buildAgendaWhatsAppMessage,
  buildAgendaWhatsAppShareUrl,
  buildAgendaWhatsAppUrl,
  buildAgendaWhatsAppWebUrl,
  formatAgendaDate,
  occurrenceTimeLabel,
  recurrenceLabel,
} from "./agenda-whatsapp";

const replacementCharacter = String.fromCharCode(0xfffd);

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

    expect(message).toContain("📅 *COMPROMISSO — NÚCLEO*");
    expect(message).toContain("📝 *Consulta do Bernardo*");
    expect(message).toContain("🗓️ *Data:* 28/08/2026");
    expect(message).toContain("🕐 *Horário:* 14:30 às 15:30");
    expect(message).toContain("📍 *Local:* Clínica Infantil");
    expect(message).toContain("👤 *Responsável:* Paulo");
    expect(message).toContain("🔁 *Recorrência:* Não se repete");
    expect(message).toContain("📌 *Status:* Agendado");
    expect(message).toContain(
      "💬 *Observações:*\nLevar carteira",
    );
    expect(message).toContain("_Enviado pelo Núcleo | Central Familiar_");
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
      "🕐 *Horário:* Dia inteiro",
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
    expect(url).toContain("%F0%9F%93%85");
    expect(url).toContain("%C3%A3");
    expect(decoded).toContain("Reunião: Núcleo & família");
    expect(decoded).toContain("Linha 1\nLinha 2 com ação.");
  });

  it("does not replace emojis or double-encode the WhatsApp URL", () => {
    const occurrence = {
      ...baseOccurrence,
      title: "Natação Bernardo",
      location: "Rua Pindorama, 456, Santo André – SP",
      assignedTo: {
        membershipId: "membership-2",
        userId: "user-2",
        name: "Gabriela De Marqui Nascimento Bertão",
      },
      startsAt: "2026-09-02T13:30:00Z",
      endsAt: "2026-09-02T14:20:00Z",
      description: "Natação do Bernardo toda quarta-feira às 10:30",
    };

    const url = buildAgendaWhatsAppUrl(occurrence, "America/Sao_Paulo");
    const decoded = decodeURIComponent(url.replace("https://wa.me/?text=", ""));

    expect(decoded).toContain("📅 *COMPROMISSO — NÚCLEO*");
    expect(decoded).toContain("📝 *Natação Bernardo*");
    expect(decoded).toContain("🗓️ *Data:* 02/09/2026");
    expect(decoded).toContain("🕐 *Horário:* 10:30 às 11:20");
    expect(decoded).toContain("Santo André – SP");
    expect(decoded).not.toContain(replacementCharacter);
    expect(decoded).not.toContain("%F0%9F%93%85");
  });

  it("builds a direct WhatsApp Web URL with intact decoded emojis", () => {
    const url = buildAgendaWhatsAppWebUrl(baseOccurrence, "America/Sao_Paulo");
    const decoded = decodeURIComponent(
      url.replace("https://web.whatsapp.com/send?text=", ""),
    );

    expect(url).toMatch(/^https:\/\/web\.whatsapp\.com\/send\?text=/);
    expect(decoded).toContain("📅");
    expect(decoded).toContain("📝");
    expect(decoded).not.toContain(replacementCharacter);
    expect(decoded).not.toContain("%F0%9F%93%85");
  });

  it("selects WhatsApp Web on desktop and wa.me on mobile", () => {
    expect(
      buildAgendaWhatsAppShareUrl(
        baseOccurrence,
        "America/Sao_Paulo",
        "Mozilla/5.0 Windows NT 10.0",
      ),
    ).toMatch(/^https:\/\/web\.whatsapp\.com\/send\?text=/);

    expect(
      buildAgendaWhatsAppShareUrl(
        baseOccurrence,
        "America/Sao_Paulo",
        "Mozilla/5.0 iPhone",
      ),
    ).toMatch(/^https:\/\/wa\.me\/\?text=/);
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

    expect(message).toContain("📌 *Status:* Cancelado");
    expect(message).toContain("❌ *Cancelado em:* 28/08/2026, 16:00");
  });
});
