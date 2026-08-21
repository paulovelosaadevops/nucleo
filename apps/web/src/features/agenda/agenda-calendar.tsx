"use client";

import {
  addDays,
  addMonths,
  endOfWeek,
  formatDateInput,
  groupOccurrencesByDate,
  isSameMonth,
  isToday,
  monthGridDates,
  parseDateInput,
  startOfWeek,
  weekDates,
} from "@/features/agenda/agenda-date-utils";
import { cn } from "@/lib/cn";
import type {
  AgendaOccurrenceSummary,
  AgendaViewMode,
} from "@/types/agenda";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";
import { useMemo } from "react";

interface AgendaCalendarProps {
  selectedDate: string;
  view: AgendaViewMode;
  occurrences:
    AgendaOccurrenceSummary[];
  onDateChange: (date: string) => void;
  onViewChange: (
    view: AgendaViewMode,
  ) => void;
}

const views: Array<{
  value: AgendaViewMode;
  label: string;
}> = [
  {
    value: "day",
    label: "Dia",
  },
  {
    value: "week",
    label: "Semana",
  },
  {
    value: "month",
    label: "Mês",
  },
];

const shortWeekdays = [
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

const fullDateFormatter =
  new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const shortDateFormatter =
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
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

export function AgendaCalendar({
  selectedDate,
  view,
  occurrences,
  onDateChange,
  onViewChange,
}: AgendaCalendarProps) {
  const groupedOccurrences =
    useMemo(
      () =>
        groupOccurrencesByDate(
          occurrences,
        ),
      [occurrences],
    );

  function navigate(
    direction: -1 | 1,
  ) {
    if (view === "month") {
      onDateChange(
        addMonths(
          selectedDate,
          direction,
        ),
      );

      return;
    }

    if (view === "week") {
      onDateChange(
        addDays(
          selectedDate,
          direction * 7,
        ),
      );

      return;
    }

    onDateChange(
      addDays(
        selectedDate,
        direction,
      ),
    );
  }

  const periodLabel =
    getPeriodLabel(
      selectedDate,
      view,
    );

  return (
    <section
      className="
        overflow-hidden
        rounded-[1.5rem]
        border
        border-white/[0.08]
        bg-white/[0.028]
        shadow-[0_24px_80px_rgba(0,0,0,0.18)]
      "
    >
      <header
        className="
          flex
          flex-col
          gap-4
          border-b
          border-white/[0.07]
          px-4
          py-4
          sm:px-5
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              flex
              size-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-white/[0.07]
              text-zinc-500
              transition
              hover:border-white/15
              hover:bg-white/[0.05]
              hover:text-white
            "
            aria-label="Período anterior"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="min-w-0 flex-1 px-1 lg:min-w-64">
            <p className="truncate text-sm font-semibold text-zinc-200">
              {periodLabel}
            </p>

            <button
              type="button"
              onClick={() =>
                onDateChange(
                  formatDateInput(
                    new Date(),
                  ),
                )
              }
              className="
                mt-0.5
                text-xs
                text-zinc-600
                transition
                hover:text-zinc-300
              "
            >
              Ir para hoje
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate(1)}
            className="
              flex
              size-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-white/[0.07]
              text-zinc-500
              transition
              hover:border-white/15
              hover:bg-white/[0.05]
              hover:text-white
            "
            aria-label="Próximo período"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div
          className="
            grid
            grid-cols-3
            rounded-xl
            border
            border-white/[0.08]
            bg-black/25
            p-1
          "
        >
          {views.map((option) => {
            const active =
              view === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onViewChange(
                    option.value,
                  )
                }
                className={cn(
                  `
                    min-w-20
                    rounded-lg
                    px-3
                    py-2
                    text-xs
                    font-medium
                    transition
                  `,
                  active
                    ? "bg-white text-black shadow-sm"
                    : "text-zinc-500 hover:text-white",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </header>

      {view === "day" && (
        <DaySelector
          selectedDate={selectedDate}
          occurrences={
            groupedOccurrences
          }
          onDateChange={onDateChange}
        />
      )}

      {view === "week" && (
        <WeekCalendar
          selectedDate={selectedDate}
          occurrences={
            groupedOccurrences
          }
          onDateChange={onDateChange}
        />
      )}

      {view === "month" && (
        <MonthCalendar
          selectedDate={selectedDate}
          occurrences={
            groupedOccurrences
          }
          onDateChange={onDateChange}
        />
      )}
    </section>
  );
}

interface CalendarViewProps {
  selectedDate: string;
  occurrences: Map<
    string,
    AgendaOccurrenceSummary[]
  >;
  onDateChange: (date: string) => void;
}

function DaySelector({
  selectedDate,
  occurrences,
  onDateChange,
}: CalendarViewProps) {
  const days = Array.from(
    { length: 7 },
    (_, index) =>
      addDays(
        selectedDate,
        index - 3,
      ),
  );

  return (
    <div className="grid grid-cols-7 gap-1 p-3 sm:gap-2 sm:p-4">
      {days.map((date) => (
        <CalendarDayButton
          key={date}
          date={date}
          selectedDate={selectedDate}
          occurrenceCount={
            occurrences.get(date)
              ?.length ?? 0
          }
          onClick={() =>
            onDateChange(date)
          }
        />
      ))}
    </div>
  );
}

function WeekCalendar({
  selectedDate,
  occurrences,
  onDateChange,
}: CalendarViewProps) {
  const days =
    weekDates(selectedDate);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[56rem] grid-cols-7">
        {days.map((date) => {
          const dayOccurrences =
            occurrences.get(date) ?? [];

          const active =
            date === selectedDate;

          return (
            <button
              key={date}
              type="button"
              onClick={() =>
                onDateChange(date)
              }
              className={cn(
                `
                  min-h-52
                  border-r
                  border-white/[0.06]
                  p-3
                  text-left
                  transition
                  last:border-r-0
                  hover:bg-white/[0.035]
                `,
                active &&
                  "bg-white/[0.055]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className={cn(
                      "text-[0.65rem] font-semibold uppercase",
                      active
                        ? "text-zinc-300"
                        : "text-zinc-600",
                    )}
                  >
                    {shortWeekdays[
                      weekDates(
                        selectedDate,
                      ).indexOf(date)
                    ]}
                  </p>

                  <p
                    className={cn(
                      `
                        mt-1
                        flex
                        size-8
                        items-center
                        justify-center
                        rounded-xl
                        text-sm
                        font-semibold
                      `,
                      active
                        ? "bg-white text-black"
                        : isToday(date)
                          ? "border border-white/30 text-white"
                          : "text-zinc-400",
                    )}
                  >
                    {
                      parseDateInput(
                        date,
                      ).getDate()
                    }
                  </p>
                </div>

                {dayOccurrences.length >
                  0 && (
                  <span className="rounded-full bg-white/[0.07] px-2 py-1 text-[0.6rem] text-zinc-500">
                    {
                      dayOccurrences.length
                    }
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {dayOccurrences
                  .slice(0, 3)
                  .map((occurrence) => (
                    <OccurrencePreview
                      key={
                        occurrence.occurrenceId
                      }
                      occurrence={
                        occurrence
                      }
                    />
                  ))}

                {dayOccurrences.length >
                  3 && (
                  <p className="px-1 text-[0.65rem] text-zinc-600">
                    +
                    {dayOccurrences.length -
                      3}{" "}
                    compromissos
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MonthCalendar({
  selectedDate,
  occurrences,
  onDateChange,
}: CalendarViewProps) {
  const days =
    monthGridDates(selectedDate);

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-white/[0.06]">
        {shortWeekdays.map(
          (weekday) => (
            <div
              key={weekday}
              className="px-1 py-3 text-center text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-600"
            >
              {weekday}
            </div>
          ),
        )}
      </div>

      <div className="grid grid-cols-7">
        {days.map((date) => {
          const dayOccurrences =
            occurrences.get(date) ?? [];

          const active =
            date === selectedDate;

          const currentMonth =
            isSameMonth(
              date,
              selectedDate,
            );

          return (
            <button
              key={date}
              type="button"
              onClick={() =>
                onDateChange(date)
              }
              className={cn(
                `
                  relative
                  min-h-20
                  border-b
                  border-r
                  border-white/[0.055]
                  p-1.5
                  text-left
                  transition
                  hover:bg-white/[0.035]
                  sm:min-h-28
                  sm:p-2
                `,
                active &&
                  "bg-white/[0.065]",
                !currentMonth &&
                  "opacity-35",
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

              <div className="mt-1.5 hidden space-y-1 sm:block">
                {dayOccurrences
                  .slice(0, 2)
                  .map((occurrence) => (
                    <div
                      key={
                        occurrence.occurrenceId
                      }
                      className={cn(
                        `
                          truncate
                          rounded-md
                          border
                          px-1.5
                          py-1
                          text-[0.58rem]
                        `,
                        occurrenceStyle(
                          occurrence.status,
                        ),
                      )}
                    >
                      {occurrence.allDay
                        ? ""
                        : `${timeFormatter.format(
                            new Date(
                              occurrence.startsAt,
                            ),
                          )} `}

                      {occurrence.title}
                    </div>
                  ))}

                {dayOccurrences.length >
                  2 && (
                  <p className="px-1 text-[0.58rem] text-zinc-600">
                    +
                    {dayOccurrences.length -
                      2}
                  </p>
                )}
              </div>

              {dayOccurrences.length >
                0 && (
                <div className="absolute bottom-2 left-2 flex gap-1 sm:hidden">
                  {dayOccurrences
                    .slice(0, 3)
                    .map((occurrence) => (
                      <span
                        key={
                          occurrence.occurrenceId
                        }
                        className={cn(
                          "size-1.5 rounded-full",
                          occurrence.status ===
                            "COMPLETED"
                            ? "bg-emerald-400"
                            : occurrence.status ===
                                "CANCELLED"
                              ? "bg-rose-400"
                              : "bg-zinc-200",
                        )}
                      />
                    ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface CalendarDayButtonProps {
  date: string;
  selectedDate: string;
  occurrenceCount: number;
  onClick: () => void;
}

function CalendarDayButton({
  date,
  selectedDate,
  occurrenceCount,
  onClick,
}: CalendarDayButtonProps) {
  const parsedDate =
    parseDateInput(date);

  const active =
    date === selectedDate;

  const weekday =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        weekday: "short",
      },
    )
      .format(parsedDate)
      .replace(".", "");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        `
          relative
          flex
          min-h-17
          flex-col
          items-center
          justify-center
          rounded-2xl
          border
          transition
          sm:min-h-20
        `,
        active
          ? "border-white bg-white text-black"
          : "border-transparent text-zinc-500 hover:border-white/[0.08] hover:bg-white/[0.035] hover:text-white",
      )}
    >
      <span className="text-[0.6rem] font-semibold uppercase">
        {weekday}
      </span>

      <span className="mt-1 text-base font-semibold">
        {parsedDate.getDate()}
      </span>

      {occurrenceCount > 0 && (
        <span
          className={cn(
            `
              absolute
              bottom-1.5
              min-w-4
              rounded-full
              px-1
              text-center
              text-[0.55rem]
              font-semibold
            `,
            active
              ? "bg-black/10 text-black"
              : "bg-white/[0.09] text-zinc-400",
          )}
        >
          {occurrenceCount}
        </span>
      )}

      {isToday(date) &&
        occurrenceCount === 0 && (
          <span
            className={cn(
              "absolute bottom-2 size-1 rounded-full",
              active
                ? "bg-black"
                : "bg-white",
            )}
          />
        )}
    </button>
  );
}

function OccurrencePreview({
  occurrence,
}: {
  occurrence: AgendaOccurrenceSummary;
}) {
  return (
    <div
      className={cn(
        `
          rounded-xl
          border
          px-2
          py-2
        `,
        occurrenceStyle(
          occurrence.status,
        ),
      )}
    >
      <p className="truncate text-[0.68rem] font-medium">
        {occurrence.title}
      </p>

      <p className="mt-1 flex items-center gap-1 text-[0.58rem] opacity-60">
        {occurrence.allDay ? (
          <>
            <CalendarDays className="size-2.5" />
            Dia inteiro
          </>
        ) : (
          <>
            <Clock3 className="size-2.5" />

            {timeFormatter.format(
              new Date(
                occurrence.startsAt,
              ),
            )}
          </>
        )}
      </p>
    </div>
  );
}

function occurrenceStyle(
  status:
    AgendaOccurrenceSummary["status"],
): string {
  if (status === "COMPLETED") {
    return "border-emerald-400/15 bg-emerald-400/[0.055] text-emerald-200";
  }

  if (status === "CANCELLED") {
    return "border-rose-400/15 bg-rose-400/[0.05] text-rose-200 opacity-60";
  }

  return "border-white/[0.07] bg-white/[0.035] text-zinc-300";
}

function getPeriodLabel(
  selectedDate: string,
  view: AgendaViewMode,
): string {
  const selected =
    parseDateInput(selectedDate);

  if (view === "month") {
    return capitalize(
      monthFormatter.format(selected),
    );
  }

  if (view === "week") {
    const firstDay =
      parseDateInput(
        startOfWeek(selectedDate),
      );

    const lastDay =
      parseDateInput(
        endOfWeek(selectedDate),
      );

    const firstLabel =
      shortDateFormatter
        .format(firstDay)
        .replace(".", "");

    const lastLabel =
      new Intl.DateTimeFormat(
        "pt-BR",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
      )
        .format(lastDay)
        .replace(".", "");

    return capitalize(
      `${firstLabel} — ${lastLabel}`,
    );
  }

  return capitalize(
    fullDateFormatter.format(selected),
  );
}