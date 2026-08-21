"use client";

import { cn } from "@/lib/cn";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AgendaCalendarStripProps {
  selectedDate: string;
  onChange: (date: string) => void;
}

const weekdayFormatter =
  new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
  });

const monthFormatter =
  new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  });

function parseDate(value: string): Date {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(
  value: string,
  amount: number,
): string {
  const date = parseDate(value);
  date.setDate(date.getDate() + amount);

  return formatDate(date);
}

export function AgendaCalendarStrip({
  selectedDate,
  onChange,
}: AgendaCalendarStripProps) {
  const selected = parseDate(selectedDate);

  const days = Array.from(
    { length: 7 },
    (_, index) =>
      addDays(selectedDate, index - 3),
  );

  const today = formatDate(new Date());

  const monthLabel = monthFormatter
    .format(selected)
    .replace(
      /^./,
      (character) => character.toUpperCase(),
    );

  return (
    <section className="rounded-[1.35rem] border border-white/[0.08] bg-white/[0.035] p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() =>
            onChange(
              addDays(selectedDate, -1),
            )
          }
          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-white/[0.06] hover:text-white"
          aria-label="Dia anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onChange(today)}
          className="text-sm font-medium capitalize text-zinc-300 transition hover:text-white"
        >
          {monthLabel}
        </button>

        <button
          type="button"
          onClick={() =>
            onChange(
              addDays(selectedDate, 1),
            )
          }
          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-white/[0.06] hover:text-white"
          aria-label="Próximo dia"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((value) => {
          const date = parseDate(value);
          const active =
            value === selectedDate;
          const isToday = value === today;

          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              className={cn(
                "relative flex min-h-16 flex-col items-center justify-center rounded-2xl border text-center transition sm:min-h-18",
                active
                  ? "border-white bg-white text-black"
                  : "border-transparent text-zinc-500 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-zinc-200",
              )}
            >
              <span className="text-[0.6rem] font-semibold uppercase">
                {weekdayFormatter
                  .format(date)
                  .replace(".", "")}
              </span>

              <span className="mt-1 text-base font-semibold">
                {date.getDate()}
              </span>

              {isToday && (
                <span
                  className={cn(
                    "absolute bottom-1.5 h-1 w-1 rounded-full",
                    active
                      ? "bg-black"
                      : "bg-white",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}