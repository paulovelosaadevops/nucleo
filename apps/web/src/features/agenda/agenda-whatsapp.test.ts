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

const replacementCharacter = "\uFFFD";

const baseOccurrence: AgendaOccurrenceDetails = {
  occurrenceId: "occurrence-1",
  eventId: "event-1",
  title: "Consulta do Bernardo",
  description: "Levar carteira de vacina\u00e7\u00e3o e exames.",
  category: "HEALTH",
  location: "Cl\u00ednica Infantil",
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

    expect(message).toContain("\u{1F4C5} *COMPROMISSO \u2014 N\u00daCLEO*");
    expect(message).toContain("\u{1F4DD} *Consulta do Bernardo*");
    expect(message).toContain("\u{1F5D3}\u{FE0F} *Data:* 28/08/2026");
    expect(message).toContain("\u{1F550} *Hor\u00e1rio:* 14:30 \u00e0s 15:30");
    expect(message).toContain("\u{1F4CD} *Local:* Cl\u00ednica Infantil");
    expect(message).toContain("\u{1F464} *Respons\u00e1vel:* Paulo");
    expect(message).toContain("\u{1F501} *Recorr\u00eancia:* N\u00e3o se repete");
    expect(message).toContain("\u{1F4CC} *Status:* Agendado");
    expect(message).toContain(
      "\u{1F4AC} *Observa\u00e7\u00f5es:*\nLevar carteira",
    );
    expect(message).toContain("_Enviado pelo N\u00facleo | Central Familiar_");
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
    expect(message).not.toContain("*Respons\u00e1vel:*");
    expect(message).not.toContain("*Observa\u00e7\u00f5es:*");
  });

  it("shows all day instead of time range", () => {
    const occurrence = {
      ...baseOccurrence,
      allDay: true,
      endsAt: null,
    };

    expect(occurrenceTimeLabel(occurrence)).toBe("Dia inteiro");
    expect(buildAgendaWhatsAppMessage(occurrence)).toContain(
      "\u{1F550} *Hor\u00e1rio:* Dia inteiro",
    );
  });

  it("preserves accents and line breaks in the encoded URL", () => {
    const occurrence = {
      ...baseOccurrence,
      title: "Reuni\u00e3o: N\u00facleo & fam\u00edlia",
      description: "Linha 1\nLinha 2 com a\u00e7\u00e3o",
    };

    const url = buildAgendaWhatsAppUrl(occurrence, "America/Sao_Paulo");
    const decoded = decodeURIComponent(url.replace("https://wa.me/?text=", ""));

    expect(url).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(url).toContain("%F0%9F%93%85");
    expect(url).toContain("%C3%A3");
    expect(decoded).toContain("Reuni\u00e3o: N\u00facleo & fam\u00edlia");
    expect(decoded).toContain("Linha 1\nLinha 2 com a\u00e7\u00e3o.");
  });

  it("does not replace emojis or double-encode the WhatsApp URL", () => {
    const occurrence = {
      ...baseOccurrence,
      title: "Nata\u00e7\u00e3o Bernardo",
      location: "Rua Pindorama, 456, Santo Andr\u00e9 \u2013 SP",
      assignedTo: {
        membershipId: "membership-2",
        userId: "user-2",
        name: "Gabriela De Marqui Nascimento Bert\u00e3o",
      },
      startsAt: "2026-09-02T13:30:00Z",
      endsAt: "2026-09-02T14:20:00Z",
      description: "Nata\u00e7\u00e3o do Bernardo toda quarta-feira \u00e0s 10:30",
    };

    const url = buildAgendaWhatsAppUrl(occurrence, "America/Sao_Paulo");
    const decoded = decodeURIComponent(url.replace("https://wa.me/?text=", ""));

    expect(decoded).toContain("\u{1F4C5} *COMPROMISSO \u2014 N\u00daCLEO*");
    expect(decoded).toContain("\u{1F4DD} *Nata\u00e7\u00e3o Bernardo*");
    expect(decoded).toContain("\u{1F5D3}\u{FE0F} *Data:* 02/09/2026");
    expect(decoded).toContain("\u{1F550} *Hor\u00e1rio:* 10:30 \u00e0s 11:20");
    expect(decoded).toContain("Santo Andr\u00e9 \u2013 SP");
    expect(decoded).not.toContain(replacementCharacter);
    expect(decoded).not.toContain("%F0%9F%93%85");
  });

  it("builds a direct WhatsApp Web URL with intact decoded emojis", () => {
    const url = buildAgendaWhatsAppWebUrl(baseOccurrence, "America/Sao_Paulo");
    const decoded = decodeURIComponent(
      url.replace("https://web.whatsapp.com/send?text=", ""),
    );

    expect(url).toMatch(/^https:\/\/web\.whatsapp\.com\/send\?text=/);
    expect(decoded).toContain("\u{1F4C5}");
    expect(decoded).toContain("\u{1F4DD}");
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
    ).toBe("23:30 \u00e0s 00:30");
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

    expect(message).toContain("\u{1F4CC} *Status:* Cancelado");
    expect(message).toContain("\u{274C} *Cancelado em:* 28/08/2026, 16:00");
  });
});
