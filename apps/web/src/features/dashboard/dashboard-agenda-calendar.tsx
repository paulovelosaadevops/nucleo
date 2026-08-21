"use client";

import {
  formatDateInput,
  isSameMonth,
  isToday,
  monthGridDates,
  parseDateInput,
} from "@/features/agenda/agenda-date-utils";
import { useDashboardCalendar } from "@/features/dashboard/use-dashboard-calendar";
import { cn } from "@/lib/cn";
import type {
  DashboardAgendaOccurrence,
} from "@/types/dashboard";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

interface DashboardAgendaCalendarProps {
  initialOccurrences:
    DashboardAgendaOccurrence[];
  unavailable?: boolean;
}

const weekdays = [
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
  "Dom",
];

const monthFormatter =
  new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  });

const selectedDateFormatter =
  new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

const timeFormatter =
  new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

function capitalize(
  value: string,
): string {
  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function occurrenceDate(
  occurrence:
    DashboardAgendaOccurrence,
): string {
  return formatDateInput(
    new Date(occurrence.startsAt),
  );
}

export function DashboardAgendaCalendar({
  initialOccurrences,
  unavailable = false,
}: DashboardAgendaCalendarProps) {
  const {
    selectedDate,
    visibleDate,
    occurrences,
    selectedOccurrences,
    loading,
    error,
    selectDate,
    previousMonth,
    nextMonth,
    goToToday,
    refresh,
  } = useDashboardCalendar(
    initialOccurrences,
    !unavailable,
  );

  const days = useMemo(
    () =>
      monthGridDates(visibleDate),
    [visibleDate],
  );

  const occurrencesByDate =
    useMemo(() => {
      const grouped = new Map<
        string,
        DashboardAgendaOccurrence[]
      >();

      for (const occurrence of occurrences) {
        const date =
          occurrenceDate(occurrence);

        const current =
          grouped.get(date) ?? [];

        current.push(occurrence);
        grouped.set(date, current);
      }

      return grouped;
    }, [occurrences]);

  const monthLabel =
    capitalize(
      monthFormatter.format(
        parseDateInput(visibleDate),
      ),
    );

  const selectedDateLabel =
    capitalize(
      selectedDateFormatter.format(
        parseDateInput(selectedDate),
      ),
    );

  if (unavailable) {
    return (
      <div className="flex min-h-80 items-center justify-center text-center">
        <p className="max-w-xs text-sm leading-6 text-zinc-600">
          Não foi possível carregar a agenda.
          Os outros módulos continuam disponíveis.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div
        className="
          overflow-hidden
          rounded-[1.25rem]
          border
          border-white/[0.07]
          bg-black/20
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            border-b
            border-white/[0.06]
            px-3
            py-3
          "
        >
          <button
            type="button"
            onClick={previousMonth}
            className="
              flex
              size-8
              items-center
              justify-center
              rounded-lg
              text-zinc-600
              transition
              hover:bg-white/[0.05]
              hover:text-white
            "
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-4" />
          </button>

          <button
            type="button"
            onClick={goToToday}
            className="
              min-w-0
              truncate
              text-sm
              font-medium
              text-zinc-300
              transition
              hover:text-white
            "
          >
            {monthLabel}
          </button>

          <div className="flex items-center">
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                void refresh()
              }
              className="
                flex
                size-8
                items-center
                justify-center
                rounded-lg
                text-zinc-600
                transition
                hover:bg-white/[0.05]
                hover:text-white
                disabled:opacity-50
              "
              aria-label="Atualizar calendário"
            >
              <RefreshCw
                className={cn(
                  "size-3.5",
                  loading &&
                    "animate-spin",
                )}
              />
            </button>

            <button
              type="button"
              onClick={nextMonth}
              className="
                flex
                size-8
                items-center
                justify-center
                rounded-lg
                text-zinc-600
                transition
                hover:bg-white/[0.05]
                hover:text-white
              "
              aria-label="Próximo mês"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-white/[0.05]">
          {weekdays.map((weekday) => (
            <div
              key={weekday}
              className="
                py-2
                text-center
                text-[0.55rem]
                font-semibold
                uppercase
                text-zinc-700
              "
            >
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((date) => {
            const dayOccurrences =
              occurrencesByDate.get(
                date,
              ) ?? [];

            const active =
              date === selectedDate;

            const currentMonth =
              isSameMonth(
                date,
                visibleDate,
              );

            return (
              <button
                key={date}
                type="button"
                onClick={() =>
                  selectDate(date)
                }
                className={cn(
                  `
                    relative
                    flex
                    min-h-12
                    flex-col
                    items-center
                    justify-center
                    border-b
                    border-r
                    border-white/[0.045]
                    transition
                    hover:bg-white/[0.04]
                    sm:min-h-14
                  `,
                  active &&
                    "bg-white/[0.07]",
                  !currentMonth &&
                    "opacity-30",
                )}
              >
                <span
                  className={cn(
                    `
                      flex
                      size-7
                      items-center
                      justify-center
                      rounded-lg
                      text-xs
                      font-medium
                    `,
                    active
                      ? "bg-white text-black"
                      : isToday(date)
                        ? "border border-white/30 text-white"
                        : "text-zinc-500",
                  )}
                >
                  {
                    parseDateInput(
                      date,
                    ).getDate()
                  }
                </span>

                {dayOccurrences.length >
                  0 && (
                  <div className="absolute bottom-1.5 flex gap-0.5">
                    {dayOccurrences
                      .slice(0, 3)
                      .map(
                        (
                          occurrence,
                        ) => (
                          <span
                            key={
                              occurrence.occurrenceId
                            }
                            className={cn(
                              "size-1 rounded-full",
                              occurrence.status ===
                                "COMPLETED"
                                ? "bg-emerald-400"
                                : "bg-zinc-300",
                            )}
                          />
                        ),
                      )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div
          className="
            mt-3
            rounded-xl
            border
            border-rose-400/15
            bg-rose-400/[0.05]
            px-3
            py-2
            text-xs
            text-rose-200
          "
        >
          {error}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-300">
            {selectedDateLabel}
          </p>

          <p className="mt-1 text-[0.65rem] text-zinc-600">
            {selectedOccurrences.length}{" "}
            {selectedOccurrences.length === 1
              ? "compromisso"
              : "compromissos"}
          </p>
        </div>

        <Link
          href={`/agenda?data=${selectedDate}`}
          className="
            text-xs
            font-medium
            text-zinc-500
            transition
            hover:text-white
          "
        >
          Abrir dia
        </Link>
      </div>

      {loading &&
      occurrences.length === 0 ? (
        <div className="mt-3 space-y-2">
          {Array.from({
            length: 2,
          }).map((_, index) => (
            <div
              key={index}
              className="
                h-16
                animate-pulse
                rounded-xl
                border
                border-white/[0.05]
                bg-white/[0.025]
              "
            />
          ))}
        </div>
      ) : selectedOccurrences.length ===
        0 ? (
        <div
          className="
            mt-3
            flex
            min-h-28
            flex-col
            items-center
            justify-center
            rounded-2xl
            border
            border-dashed
            border-white/[0.07]
            text-center
          "
        >
          <CalendarDays className="size-5 text-zinc-700" />

          <p className="mt-2 text-xs text-zinc-600">
            Nenhum compromisso neste dia.
          </p>

          <Link
            href={`/agenda?data=${selectedDate}&novo=true`}
            className="
              mt-2
              text-[0.68rem]
              font-medium
              text-zinc-400
              transition
              hover:text-white
            "
          >
            Adicionar compromisso
          </Link>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {selectedOccurrences
            .slice(0, 4)
            .map((occurrence) => (
              <Link
                key={
                  occurrence.occurrenceId
                }
                href={`/agenda?data=${selectedDate}&ocorrencia=${occurrence.occurrenceId}`}
                className="
                  group
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-white/[0.06]
                  bg-white/[0.025]
                  px-3
                  py-3
                  transition
                  hover:border-white/15
                  hover:bg-white/[0.045]
                "
              >
                <div
                  className="
                    flex
                    size-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-white/[0.07]
                    bg-black/25
                    text-zinc-600
                  "
                >
                  {occurrence.allDay ? (
                    <CalendarDays className="size-4" />
                  ) : (
                    <Clock3 className="size-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="
                      truncate
                      text-xs
                      font-medium
                      text-zinc-300
                      group-hover:text-white
                    "
                  >
                    {occurrence.title}
                  </p>

                  <div
                    className="
                      mt-1
                      flex
                      flex-wrap
                      items-center
                      gap-x-3
                      gap-y-1
                      text-[0.62rem]
                      text-zinc-600
                    "
                  >
                    <span>
                      {occurrence.allDay
                        ? "Dia inteiro"
                        : timeFormatter.format(
                            new Date(
                              occurrence.startsAt,
                            ),
                          )}
                    </span>

                    {occurrence.location && (
                      <span className="flex min-w-0 items-center gap-1">
                        <MapPin className="size-2.5 shrink-0" />

                        <span className="truncate">
                          {
                            occurrence.location
                          }
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}

          {selectedOccurrences.length >
            4 && (
            <Link
              href={`/agenda?data=${selectedDate}`}
              className="
                block
                py-2
                text-center
                text-xs
                text-zinc-500
                transition
                hover:text-white
              "
            >
              Ver mais{" "}
              {selectedOccurrences.length -
                4}{" "}
              compromissos
            </Link>
          )}
        </div>
      )}
    </div>
  );
}