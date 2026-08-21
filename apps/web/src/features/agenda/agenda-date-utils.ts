import type {
  AgendaOccurrenceSummary,
  AgendaViewMode,
} from "@/types/agenda";

export function formatDateInput(
  date: Date,
): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseDateInput(
  value: string,
): Date {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

export function addDays(
  value: string,
  amount: number,
): string {
  const date = parseDateInput(value);

  date.setDate(
    date.getDate() + amount,
  );

  return formatDateInput(date);
}

export function addMonths(
  value: string,
  amount: number,
): string {
  const date = parseDateInput(value);
  const originalDay = date.getDate();

  date.setDate(1);
  date.setMonth(
    date.getMonth() + amount,
  );

  const lastDayOfTargetMonth =
    new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();

  date.setDate(
    Math.min(
      originalDay,
      lastDayOfTargetMonth,
    ),
  );

  return formatDateInput(date);
}

export function startOfWeek(
  value: string,
): string {
  const date = parseDateInput(value);

  const weekday = date.getDay();

  const distanceFromMonday =
    weekday === 0
      ? -6
      : 1 - weekday;

  date.setDate(
    date.getDate() +
      distanceFromMonday,
  );

  return formatDateInput(date);
}

export function endOfWeek(
  value: string,
): string {
  return addDays(
    startOfWeek(value),
    6,
  );
}

export function startOfMonth(
  value: string,
): string {
  const date = parseDateInput(value);

  date.setDate(1);

  return formatDateInput(date);
}

export function endOfMonth(
  value: string,
): string {
  const date = parseDateInput(value);

  date.setMonth(
    date.getMonth() + 1,
    0,
  );

  return formatDateInput(date);
}

export function startOfMonthGrid(
  value: string,
): string {
  return startOfWeek(
    startOfMonth(value),
  );
}

export function endOfMonthGrid(
  value: string,
): string {
  return endOfWeek(
    endOfMonth(value),
  );
}

export function datesBetween(
  from: string,
  to: string,
): string[] {
  const dates: string[] = [];

  let current = from;

  while (current <= to) {
    dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
}

export function weekDates(
  selectedDate: string,
): string[] {
  const firstDay =
    startOfWeek(selectedDate);

  return Array.from(
    { length: 7 },
    (_, index) =>
      addDays(firstDay, index),
  );
}

export function monthGridDates(
  selectedDate: string,
): string[] {
  return datesBetween(
    startOfMonthGrid(selectedDate),
    endOfMonthGrid(selectedDate),
  );
}

export function dateKeyFromInstant(
  value: string,
): string {
  return formatDateInput(
    new Date(value),
  );
}

export function occurrencesOnDate(
  occurrences:
    AgendaOccurrenceSummary[],
  date: string,
): AgendaOccurrenceSummary[] {
  return occurrences
    .filter(
      (occurrence) =>
        dateKeyFromInstant(
          occurrence.startsAt,
        ) === date,
    )
    .sort(
      (left, right) =>
        new Date(left.startsAt).getTime() -
        new Date(right.startsAt).getTime(),
    );
}

export function groupOccurrencesByDate(
  occurrences:
    AgendaOccurrenceSummary[],
): Map<string, AgendaOccurrenceSummary[]> {
  const grouped = new Map<
    string,
    AgendaOccurrenceSummary[]
  >();

  for (const occurrence of occurrences) {
    const date = dateKeyFromInstant(
      occurrence.startsAt,
    );

    const current =
      grouped.get(date) ?? [];

    current.push(occurrence);

    grouped.set(date, current);
  }

  for (const dateOccurrences of grouped.values()) {
    dateOccurrences.sort(
      (left, right) =>
        new Date(left.startsAt).getTime() -
        new Date(right.startsAt).getTime(),
    );
  }

  return grouped;
}

export function agendaPeriod(
  selectedDate: string,
  view: AgendaViewMode,
) {
  let fromDate: string;
  let toDate: string;

  if (view === "week") {
    fromDate =
      startOfWeek(selectedDate);

    toDate =
      endOfWeek(selectedDate);
  } else if (view === "month") {
    fromDate =
      startOfMonthGrid(selectedDate);

    toDate =
      endOfMonthGrid(selectedDate);
  } else {
    fromDate = selectedDate;
    toDate = selectedDate;
  }

  const from =
    parseDateInput(fromDate);

  from.setHours(0, 0, 0, 0);

  const to =
    parseDateInput(toDate);

  to.setHours(23, 59, 59, 999);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    fromDate,
    toDate,
  };
}

export function isSameMonth(
  date: string,
  reference: string,
): boolean {
  const parsedDate =
    parseDateInput(date);

  const parsedReference =
    parseDateInput(reference);

  return (
    parsedDate.getFullYear() ===
      parsedReference.getFullYear() &&
    parsedDate.getMonth() ===
      parsedReference.getMonth()
  );
}

export function isToday(
  value: string,
): boolean {
  return (
    value ===
    formatDateInput(new Date())
  );
}